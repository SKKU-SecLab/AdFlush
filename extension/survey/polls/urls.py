from django.urls import path
from . import views

urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path("<int:pk>/done/", views.DoneView.as_view(), name="done"),
    path("vote/", views.vote, name="vote"),
]

app_name = "polls"
