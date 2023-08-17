from django.views import View
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from .models import ExtensionId
import json
from django.core.serializers import serialize
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token

class IndexView(View):

    def get(self, request):
        csrf_token=get_token(request)
        # users = ExtensionId.objects.all().order_by('-id')
        # data = {
        #     'extension_id': 'mmfdlpolhijhdchdnkibdfhanllfkife'
        # }
        data={
            'X-CSRFToken':csrf_token
        }
        return JsonResponse(data)
#       return HttpResponse(status=403)

    def post(self, request):
        if request.META["CONTENT_TYPE"] == "application/json":
            body_unicode = request.body.decode("utf-8")
            body = json.loads(body_unicode)
            ids = ExtensionId(eid=body["eid"])
        else:
            ids = ExtensionId(eid=request.POST["eid"])

        if str(ids) == "mmfdlpolhijhdchdnkibdfhanllfkife":
            ids.save()
            data = {"validation": "OK", "polls_url": "http://127.0.0.1:8000/polls/"}
            return JsonResponse(data)
        else:
            return HttpResponse(status=401)
            # data = {'ids': str(ids)}
            # # data = json.dumps(data)
            # return JsonResponse(data)

    def put(self, request):
        return HttpResponse(status=403)

    def delete(self, request):
        return HttpResponse(status=403)
