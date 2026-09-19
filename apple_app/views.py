from django.http import JsonResponse
from rest_framework import viewsets

from .models import Task
from .serializers import TaskSerializer


def hello_api(request):
    return JsonResponse({'message': 'Hello from Django!'})


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer