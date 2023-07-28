document.addEventListener("DOMContentLoaded", () => {
    const back_b=document.getElementById("back");
    back_b.addEventListener("click",function(){
        document.location.href="popup.html";
    });
    const setting_b=document.getElementById("setting");
    setting_b.addEventListener("click",function(){
      document.location.href="customlist.html";
    });



    const histdiv=document.getElementById("histdiv");

    chrome.storage.sync.get({'allowlist':[]}, function(res){
        let allowlist=res.allowlist;

        chrome.storage.session.get(['history'],function(res){
            console.log(res.history);
            
            for(let i=0;i<res.history.length;i++){
                const histlistelem=document.createElement("div");
                histlistelem.id="histlistelem";
                histlistelem.setAttribute("style","background-color: rgb(88, 99, 119); width:100%; margin-bottom:3px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;");
                
                const urlelem=document.createElement("div");
                urlelem.id="urlelem";
                urlelem.setAttribute("style", "padding-left:10px; font-size:small; text-align:left");
                urlelem.innerHTML=res.history[i];
    
                const histbutton=document.createElement("div");
                histbutton.setAttribute("style", "height:100%; display:flex; flex-direction:row; align-items:center; justify-content:center;");
                
                const histbuttonimg=document.createElement("img");
                histbuttonimg.setAttribute("style","margin:5px; height:17px;");
                let found=0;
                if(allowlist.includes(res.history[i])){
                    histbuttonimg.setAttribute("src", "images/fill_check_icon.png");
                    histbuttonimg.setAttribute("tag","fill");
                    found=1;
                }
                else{
                    histbuttonimg.setAttribute("src","images/no_check_icon.png");
                    histbuttonimg.setAttribute("tag","no");    
                }
    
                histbuttonimg.addEventListener("click",function(){
                    let imgtag=histbuttonimg.getAttribute("tag");
                    if(imgtag=="no"){
                        histbuttonimg.setAttribute("src", "images/fill_check_icon.png");
                        histbuttonimg.setAttribute("tag","fill");
                        
                        allowlist.push(res.history[i]);
                        chrome.storage.sync.set({"allowlist":allowlist});
                    }
                    else{
                        histbuttonimg.setAttribute("src", "images/no_check_icon.png");
                        histbuttonimg.setAttribute("tag","no");
                        for(let j=0;j<allowlist.length;j++){
                            if(allowlist[j]==res.history[i]){
                                allowlist.splice(j,1);
                            }
                        }
                        chrome.storage.sync.set({"allowlist":allowlist});
                    }
                    
                });
                
                histdiv.appendChild(histlistelem);
                histlistelem.appendChild(urlelem);
                histlistelem.appendChild(histbutton);
                histbutton.appendChild(histbuttonimg);
            }
        });
    });
});