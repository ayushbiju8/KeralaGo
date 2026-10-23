from django.contrib import admin
from django.urls import path, include
from api.views import db_dashboard_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('db-dashboard/', db_dashboard_view, name='db_dashboard'),
    path('api/', include('api.urls')),
]
