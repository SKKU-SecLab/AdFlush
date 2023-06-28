document.addEventListener("DOMContentLoaded", () => {
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
});

document.body.addEventListener("click",function(){
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
});