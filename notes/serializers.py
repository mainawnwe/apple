from rest_framework import serializers
from .models import Note, Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'url', 'original_name', 'content_type', 'size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class NoteSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    upload_files = serializers.ListField(
        child=serializers.FileField(max_length=255, allow_empty_file=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Note
        fields = [
            'id', 'user',
            'title', 'content', 'note_type', 'priority',
            'reminder_datetime', 'reminder_sent',
            'tags', 'created_at', 'updated_at',
            'attachments', 'upload_files',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'reminder_sent']

    def create(self, validated_data):
        files = validated_data.pop('upload_files', [])
        note = Note.objects.create(**validated_data)
        for f in files:
            Attachment.objects.create(
                note=note,
                file=f,
                original_name=f.name,
                content_type=getattr(f, 'content_type', '') or '',
                size=f.size,
            )
        return note

    def update(self, instance, validated_data):
        files = validated_data.pop('upload_files', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for f in files:
            Attachment.objects.create(
                note=instance,
                file=f,
                original_name=f.name,
                content_type=getattr(f, 'content_type', '') or '',
                size=f.size,
            )
        return instance