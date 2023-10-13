document.addEventListener("DOMContentLoaded", () => {
  
  const toggle_b=document.getElementById("toggleswitch");
  const toggle=document.getElementById("toggle");
  const trigger=document.getElementById('trigger');
  const onoffdes=document.getElementById("onoffdes");

  chrome.storage.sync.get({"toggle":true},function(res){
    if(res.toggle){
      toggle.checked=true;
      onoffdes.innerText="AdFlush ON";
    }
    else{
      toggle.checked=false;
      onoffdes.innerText="AdFlush OFF";
    }
  });

  toggle_b.addEventListener("click", function(){
    toggle_click()
  });
  trigger.addEventListener('click',function(){
    gettimelog();
  });
  cal_stat();
});

function gettimelog(){
  const reslist=document.getElementById('reslist');
  reslist.innerHTML='';

  chrome.runtime.sendMessage({ action: "time" }, (response) => {
    if(response){
      let len=response['ext'].length;
      if(len>0){
        for(let i=0;i<len;i++){
          let ext_time=response['ext'][i];
          let inf_time=response['inf'][i];
          const li = document.createElement("li");
          let text=String(ext_time)+','+String(inf_time);
          li.textContent=text;
          reslist.appendChild(li);
        }
      }  
    }
  });
}

function toggle_click(){
  const toggle=document.getElementById("toggle");
  const onoffdes=document.getElementById("onoffdes");

  if(!toggle.checked){
    chrome.storage.sync.set({"toggle":true});
    onoffdes.innerText="AdFlush ON";
    console.log("On");
  }
  else{
    chrome.storage.sync.set({"toggle":false});
    onoffdes.innerText="AdFlush OFF";
    console.log("Off");
  }
}

function cal_stat(){
  const showdiv = document.getElementById("showdiv");
  const extdiv = document.getElementById("extract");
  const infdiv = document.getElementById("inference");

  chrome.runtime.sendMessage({ action: "showBlocks" }, (response) => {
    if(response){
      let blocked=response['block'];
      showdiv.innerHTML=blocked;

      let len=response['ext'].length;
      if(len>0){
        let ext_time=0;
        let inf_time=0;
        for(let i=0;i<len;i++){
          ext_time+=response['ext'][i];
          inf_time+=response['inf'][i];
        }
        ext_time=ext_time/len;
        inf_time=inf_time/len;
        ext_time=ext_time/1000;
        inf_time=inf_time/1000;
        extdiv.innerHTML="Avg. extraction time: "+parseFloat(ext_time).toFixed(3)+"s";
        infdiv.innerHTML="Avg. inference time: "+parseFloat(inf_time).toFixed(3)+"s";
      }
    }
  });
}