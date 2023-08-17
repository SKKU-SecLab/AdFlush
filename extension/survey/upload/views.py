from django.views import View
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.core.serializers import serialize
from django.core.files import File
from django.core.files.storage import FileSystemStorage
from .models import WhitelistPost
import csv
import json
import base64
import re


class IndexView(View):
    def get(self, request):
        return HttpResponse(status=403)

    def post(self, request):
        if request.META["CONTENT_TYPE"] == "application/json":
            request = json.loads(request.body)
            uploader = WhitelistPost(
                eid=request["eid"],
                domain_cnt=request["length"],
                payload=request["payload"],
            )
        else:
            uploader = WhitelistPost(
                eid=request.POST["eid"],
                domain_cnt=request.POST["length"],
                payload=request.POST["payload"],
            )
            
        if str(uploader.eid) == "mmfdlpolhijhdchdnkibdfhanllfkife":
            payload_bytes = base64.b64decode(str(uploader.payload))
            decoded_payload = payload_bytes.decode("ascii")
            
            regex = re.compile(
                r"^@*\|*(((?!-)[A-Za-z0–9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6})"
            )

            if decoded_payload.count(",") == (int(uploader.domain_cnt) - 1):
                domains = decoded_payload.split(",")

                with open("whitelist.csv","r") as f:
                    lines=f.readlines()
                    for l in lines:
                        l=l.strip()
                        domains.append(l)

                domain_valid = []
                for domain in domains:
                    if (len(str(domain)) > 255) | (
                        bool(regex.match(str(domain))) != True
                    ):
                        domain_valid.append(False)
                        return HttpResponse(status=401)
                    else:
                        domain_valid.append(True)

                data = {"status": "ok", "length":int(uploader.domain_cnt)}
                
                with open("whitelist.csv", "w") as f:
                    for d in domains:
                        f.write(d+"\n")

                uploader.save()
                
                return JsonResponse(data)
            else:
                return HttpResponse(status=401)
        else:
            return HttpResponse(status=401)

    def put(self, request):
        return HttpResponse(status=403)

    def delete(self, request):
        return HttpResponse(status=403)
