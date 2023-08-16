document.addEventListener("DOMContentLoaded", () => {
  
  const toggle_b=document.getElementById("toggleswitch");
  const toggle=document.getElementById("toggle");

  const onoffdes=document.getElementById("onoffdes");

  chrome.storage.sync.get(["toggle"],function(res){
    if(res.toggle){
      toggle.checked=true;
      onoffdes.innerText="De-Adlock ON";
    }
    else{
      toggle.checked=false;
      onoffdes.innerText="De-Adlock OFF";
    }
  });

  toggle_b.addEventListener("click", function(){
    toggle_click()
  });

  cal_stat();

  document.body.addEventListener("click",()=>{cal_stat();});

  chrome.runtime.sendMessage({action:"saveHistory"});

  const setting_b=document.getElementById("setting");
  setting_b.addEventListener("click",function(){
    document.location.href="customlist.html";
  });

  const history_b=document.getElementById("history");
  history_b.addEventListener("click",function(){
    document.location.href="history.html";
  });
});



function toggle_click(){
  const toggle=document.getElementById("toggle");
  const onoffdes=document.getElementById("onoffdes");

  if(!toggle.checked){
    chrome.storage.sync.set({"toggle":true});
    onoffdes.innerText="De-Adlock ON";
    console.log("On");
  }
  else{
    chrome.storage.sync.set({"toggle":false});
    onoffdes.innerText="De-Adlock OFF";
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