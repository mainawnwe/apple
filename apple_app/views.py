from django.http import JsonResponse
from django.shortcuts import render

def home(request):
    return render(request, 'home.html')

def hello_api(request):
    return JsonResponse({'message': 'Hello from Django!'})