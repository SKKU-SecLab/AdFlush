from django.db import models
from django.contrib.auth.models import User

class WhitelistPost(models.Model):
    eid = models.CharField(max_length=32)
    domain_cnt = models.IntegerField(default=0)
    payload = models.CharField(max_length=128000, blank=False)

    def __str__(self):
        return self.eid, self.payload

    def __int__(self):
        return self.domain_cnt
