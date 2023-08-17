from django.urls import path
from . import views

app_name = "upload"
urlpatterns = [path("", views.IndexView.as_view(), name="index")]
