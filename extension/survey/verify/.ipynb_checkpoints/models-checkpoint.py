from django.db import models

class ExtensionId(models.Model):
    eid = models.CharField(max_length=32)
    
    def __str__(self):
        return self.eid