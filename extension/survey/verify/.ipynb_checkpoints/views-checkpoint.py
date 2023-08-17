from django.views import View
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from .models import ExtensionId
import json
from django.core.serializers import serialize

class IndexView(View):
    def get(self, request):
        # users = ExtensionId.objects.all().order_by('-id')
        # data = {
        #     'extension_id': 'mmfdlpolhijhdchdnkibdfhanllfkife'
        # }
        # return JsonResponse(data)
        return HttpResponse(status=403)

    def post(self, request):
        if request.META['CONTENT_TYPE'] == "application/json":
            request = json.loads(request.body)
            ids = ExtensionId(eid = request['eid'])
        else:
            ids = ExtensionId(eid = request.POST['eid'])
        
        if str(ids) == 'mmfdlpolhijhdchdnkibdfhanllfkife':
            ids.save()
            data = {
                'validation': 'OK',
                'polls_url': 'https://seclab.co.kr/polls/'
            }
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
    