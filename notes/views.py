from rest_framework import viewsets, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['note_type', 'priority']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'reminder_datetime']

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from tasks.models import Task


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """Search across Notes and Tasks for the current user."""
    q = (request.query_params.get('q') or '').strip()
    if len(q) < 2:
        return Response({'notes': [], 'tasks': [], 'query': q})

    user = request.user

    notes = Note.objects.filter(user=user).filter(
        Q(title__icontains=q) |
        Q(content__icontains=q) |
        Q(tags__icontains=q)
    )[:10]

    tasks = Task.objects.filter(user=user).filter(
        Q(title__icontains=q) |
        Q(description__icontains=q) |
        Q(tags__icontains=q)
    )[:10]

    from .serializers import NoteSerializer
    from tasks.serializers import TaskSerializer

    return Response({
        'query': q,
        'notes': NoteSerializer(notes, many=True, context={'request': request}).data,
        'tasks': TaskSerializer(tasks, many=True).data,
    })

from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    """Return summary stats for the current user."""
    user = request.user

    total_notes = Note.objects.filter(user=user).count()
    total_tasks = Task.objects.filter(user=user).count()
    completed_tasks = Task.objects.filter(user=user, completed=True).count()
    active_tasks = total_tasks - completed_tasks
    completion_rate = round((completed_tasks / total_tasks * 100)) if total_tasks else 0

    # Priority breakdown (tasks)
    priority_breakdown = {
        'high': Task.objects.filter(user=user, priority='high').count(),
        'medium': Task.objects.filter(user=user, priority='medium').count(),
        'low': Task.objects.filter(user=user, priority='low').count(),
    }

    # Note type breakdown
    note_types = {
        'text': Note.objects.filter(user=user, note_type='text').count(),
        'image': Note.objects.filter(user=user, note_type='image').count(),
        'file': Note.objects.filter(user=user, note_type='file').count(),
    }

    # Overdue tasks
    now = timezone.now()
    overdue_tasks = Task.objects.filter(
        user=user,
        completed=False,
        due_date__lt=now,
    ).count()

    # Upcoming reminders (next 7 days)
    week_from_now = now + timedelta(days=7)
    upcoming_note_reminders = Note.objects.filter(
        user=user,
        reminder_sent=False,
        reminder_datetime__gte=now,
        reminder_datetime__lte=week_from_now,
    ).count()
    upcoming_task_reminders = Task.objects.filter(
        user=user,
        completed=False,
        reminder_sent=False,
        reminder_datetime__gte=now,
        reminder_datetime__lte=week_from_now,
    ).count()

    # Last 7 days activity (notes + tasks created per day)
    days = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        notes_count = Note.objects.filter(
            user=user, created_at__gte=day_start, created_at__lt=day_end
        ).count()
        tasks_count = Task.objects.filter(
            user=user, created_at__gte=day_start, created_at__lt=day_end
        ).count()
        days.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'label': day_start.strftime('%a'),
            'notes': notes_count,
            'tasks': tasks_count,
            'total': notes_count + tasks_count,
        })

    # Top tags
    from collections import Counter
    tag_counter = Counter()
    for note in Note.objects.filter(user=user).values_list('tags', flat=True):
        for tag in (note or '').split(','):
            t = tag.strip()
            if t:
                tag_counter[t] += 1
    for task in Task.objects.filter(user=user).values_list('tags', flat=True):
        for tag in (task or '').split(','):
            t = tag.strip()
            if t:
                tag_counter[t] += 1

    top_tags = [{'name': k, 'count': v} for k, v in tag_counter.most_common(8)]

    return Response({
        'totals': {
            'notes': total_notes,
            'tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'active_tasks': active_tasks,
            'overdue_tasks': overdue_tasks,
            'completion_rate': completion_rate,
        },
        'priority_breakdown': priority_breakdown,
        'note_types': note_types,
        'reminders': {
            'notes': upcoming_note_reminders,
            'tasks': upcoming_task_reminders,
        },
        'activity_7d': days,
        'top_tags': top_tags,
    })