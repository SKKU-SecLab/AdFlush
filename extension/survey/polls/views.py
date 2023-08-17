from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from .models import Question, Choice
from django.http import Http404
from django.views import generic
from django import forms

from django.views.decorators.csrf import csrf_protect

class IndexView(generic.ListView):
    template_name = "polls/index.html"
    context_object_name = "latest_question_list"

    def get_queryset(self):
        """Return the last five published question."""
        return Question.objects.order_by("-pub_date")[:5]

class DoneView(generic.DetailView):
    model = Question
    template_name = "polls/done.html"

@csrf_protect
def vote(request):
    try:
        selected_choice = []
        latest_question_list = Question.objects.order_by("-pub_date")[:5]
        for q in latest_question_list:
            req = request.POST["choice" + str(q.id)]
            selected_choice.append(q.choice_set.get(pk=req))
    except (KeyError, Choice.DoesNotExist):
        # Redisplay the question voting form.
        return HttpResponseRedirect("http://127.0.0.1:8000/polls/")
    else:
        for sc in selected_choice:
            sc.votes += 1
            sc.save()
        return HttpResponseRedirect(reverse("polls:done", args=(1,)))
