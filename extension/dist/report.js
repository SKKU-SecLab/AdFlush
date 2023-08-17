document.addEventListener("DOMContentLoaded", () => {
    const back_b=document.getElementById("back");
    back_b.addEventListener("click",function(){
        document.location.href="popup.html";
    });

    const history_b=document.getElementById("history");
    history_b.addEventListener("click",function(){
        document.location.href="history.html";
    });

    const setting_b=document.getElementById("setting");
    setting_b.addEventListener("click",function(){
      document.location.href="customlist.html";
    });

    const upload_b=document.getElementById("upload");
    upload_b.addEventListener("click", function(){
        document.location.href="upload.html";
    });

    const submit_b=document.getElementById("submit");
    submit_b.addEventListener("click",function(){
        chrome.tabs.query({active: true},function(tabs){
            let found=false;
            for(const tab of tabs){
                const turl=tab.url;
    
                if(turl.startsWith("http://127.0.0.1:8000/polls/")){
                    found=true;
                    break;
                }
            }
            if(!found){
                chrome.tabs.create({url:"submit.html"});    
            }
        });
    });
});