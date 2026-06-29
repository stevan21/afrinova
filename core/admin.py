from django.contrib import admin
from .models import Member, Expertise, Note, Report, Message, Devis


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("name", "poste", "pole", "phone")
    search_fields = ("user__first_name", "user__username", "pole")


@admin.register(Expertise)
class ExpertiseAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "updated")
    search_fields = ("name",)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "updated")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "date", "updated")
    search_fields = ("title", "author")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "read", "created")


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display = ("name", "service", "status", "created")
    list_filter = ("status",)
    search_fields = ("name", "email", "phone")
