import uuid
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from django.utils.timezone import now

from srs_utils.BaseModel import BaseModel
from srs_uaa.models import UsersWithRoles


class ProfileTypeChoices(models.TextChoices):
    ADMIN = "ADMIN", "ADMIN"
    NORMAL_USER = "NORMAL_USER", "NORMAL_USER"


class UserProfile(BaseModel):
    account_type = models.CharField(
        choices=ProfileTypeChoices.choices,
        max_length=9000,
        default=ProfileTypeChoices.NORMAL_USER,
    )
    photo = models.CharField(
        default="/profiles/user_profile.png", max_length=600, blank=True, null=True
    )
    profile_user = models.OneToOneField(
        User, related_name="profile", on_delete=models.CASCADE, db_index=True
    )
    has_been_verified = models.BooleanField(default=False)


    # These are helper properties to easily access User model data.
    @property
    def first_name(self):
        return self.profile_user.first_name

    @property
    def last_name(self):
        return self.profile_user.last_name

    @property
    def username(self):
        return self.profile_user.username

    @property
    def email(self): 
        return self.profile_user.email
    
    @property
    def role(self):
        try:
            return UsersWithRoles.objects.filter(user_with_role_user = self.profile_user).first().user_with_role_role
        except:
            return  None
    def __str__(self):
        return f"Profile for {self.profile_user.username}"

    class Meta:
        db_table = "user_profiles"
        ordering = ["-primary_key"]
        verbose_name_plural = "USER PROFILES"

    def __str__(self):
        return f"{self.profile_user.first_name} - {self.profile_user.last_name}"



# Model to store temporary tokens for password reset requests.
class ForgotPasswordRequestUser(BaseModel):
    request_user = models.ForeignKey(
        User, related_name="request_profile", on_delete=models.CASCADE
    )
    request_token = models.CharField(max_length=300, editable=False, default=None)
    request_is_used = models.BooleanField(default=False)
    request_is_active = models.BooleanField(default=True)
    request_expiration_time = models.DateTimeField(default=now)

    class Meta:
        db_table = "users_forgot_password_request"
        ordering = ["-primary_key"]
        verbose_name_plural = "FORGOT PASSWORD REQUESTS"

    def __str__(self):
        return f"{self.request_user} - {self.request_token}"

    def has_expired(self):
        # Calculate the time difference between now and request_created_date
        current_time = datetime.now()
        time_difference = current_time - self.created_date

        # Check if the time difference is greater than 24 hours (86400 seconds)
        if time_difference.total_seconds() > 86400:
            return True

        return False


class ActivateAccountTokenUser(BaseModel):
    token_user = models.ForeignKey(
        User, related_name="token_user", on_delete=models.CASCADE
    )
    token_token = models.CharField(max_length=300, editable=False, default=None)
    token_is_used = models.BooleanField(default=False)
    token_is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "users_activate_account_token"
        ordering = ["-primary_key"]
        verbose_name_plural = "ACTIVATE ACCOUNT TOKEN"

    def __str__(self):
        return f"{self.token_user} - {self.token_token}"

    def has_expired(self):
        # Get the current time in UTC
        current_time = timezone.now()

        # Calculate the time difference between now and token_created_date
        time_difference = current_time - self.created_date

        # Define a timedelta of 24 hours
        expiration_period = timedelta(hours=24)

        # Check if the time difference is greater than the expiration period
        if time_difference > expiration_period:
            return True
        return False
