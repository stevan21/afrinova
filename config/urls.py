from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve as static_serve
from core import views

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("core.urls")),

    # Pages (templates Django)
    path("", views.index, name="index"),
    path("index.html", views.index),
    path("service.html", views.service, name="service"),
    path("admin.html", views.admin_page, name="admin-page"),
    path("expert.html", views.expert_page, name="expert-page"),

    # Médias (photos uploadées) — servis en dev comme en prod
    re_path(r"^media/(?P<path>.*)$", static_serve, {"document_root": settings.MEDIA_ROOT}),
]
