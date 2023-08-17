from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("upload/", include("upload.urls")),
    path("verify/", include("verify.urls")),
    path("polls/", include("polls.urls")),
    path("admin/", admin.site.urls),
]
