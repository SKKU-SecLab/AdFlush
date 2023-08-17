document.addEventListener("DOMContentLoaded", () => {
    const back_b=document.getElementById("back");
    back_b.addEventListener("click",function(){
        document.location.href="popup.html";
    });
  
    const history_b=document.getElementById("history");
    history_b.addEventListener("click",function(){
      document.location.href="history.html";
    });

    const report_b=document.getElementById("report");
    report_b.addEventListener("click",function(){
      document.location.href="report.html";
    });

    chrome.storage.sync.get({'allowlist':[]},function(res){
        let allowlist=res.allowlist;
        console.log(allowlist);

        build_list(allowlist, allowlist);
    });
    

    const plusdiv=document.getElementById("plusdiv");
    const plusimg=document.getElementById("plusimg");

    plusimg.addEventListener("click",function(){
        if(plusdiv.getAttribute("tag")=="input"){
            const custominput=document.getElementById("custominput");
            const url=custominput.value;
            const domain_regex=/^((?!-)[A-Za-z0–9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/gm;
            if(url.match(domain_regex)){
                chrome.storage.sync.get({'allowlist':[]},function(res){
                    let allowlist=res.allowlist;
                    console.log(allowlist);

                    if(!allowlist.includes(url)){
                        allowlist.push(url);
                        chrome.storage.sync.set({"allowlist":allowlist},function(){
                            custominput.remove();
                            const addlist=[url];
                            build_list(addlist, allowlist);        
                        });
                    }
                });
            }
        }
    });

    plusdiv.addEventListener("click",function(){
        if(plusdiv.getAttribute("tag")=="plus"){
            plusdiv.setAttribute("tag", "input");
            plusimg.setAttribute("src","images/check_icon.png");
            plusimg.setAttribute("style", "margin: 5px; height: 13px");
            plusdiv.setAttribute("style", "margin-bottom:15px; background-color: rgb(88, 99, 119); width:100%; display:flex; flex-direction:row; align-items:center; justify-content:space-between;")

            const custominput=document.createElement("input");
            custominput.setAttribute("type","url");
            custominput.setAttribute("id","custominput");
            custominput.setAttribute("placeholder","Enter Domain");
            custominput.setAttribute("minlength",1);

            custominput.addEventListener("keyup",function(event){
                if(event.key=="Enter"){
                    plusimg.click();
                }
            }); 

            plusdiv.insertBefore(custominput, plusdiv.firstChild);

            custominput.focus();
        }
        
    }); 

});

function build_list(addlist ,allowlist){
    const whitediv=document.getElementById("whitediv");
    const plusdiv=document.getElementById("plusdiv");
    const plusimg=document.getElementById("plusimg");
    
    for(let url of addlist){
        plusimg.setAttribute("src","images/plus_icon.png");
        plusimg.setAttribute("style", "margin:5px; height:17px");
        plusdiv.setAttribute("style", "margin-bottom:15px; background-color: rgb(88, 99, 119); width:100%; display:flex; flex-direction:row; align-items:center; justify-content:center;");
    
        const whitelistelem=document.createElement("div");
        whitelistelem.id="whitelistelem";
        whitelistelem.setAttribute("style","background-color: rgb(88, 99, 119); width:100%; margin-bottom:3px; display:flex; flex-direction:row; align-items:center; justify-content:space-between;");
        
        const urlelem=document.createElement("div");
        urlelem.id="urlelem";
        urlelem.setAttribute("style", "padding-left:10px; font-size:small;");
        urlelem.innerHTML=url;
    
        const buttondiv=document.createElement("div");
        buttondiv.setAttribute("style","height:100%; width:50px; display:flex; flex-direction:row; align-items:center; justify-content:center;")
    
        const delbutton=document.createElement("div");
        delbutton.setAttribute("style", "height:100%; display:flex; flex-direction:row; align-items:center; justify-content:center;");
        
        const delbuttonimg=document.createElement("img");
        delbuttonimg.setAttribute("style","margin:5px; height:17px;");
        delbuttonimg.setAttribute("src", "images/del_icon.png");
    
        whitediv.appendChild(whitelistelem);
        whitelistelem.appendChild(urlelem);
        whitelistelem.appendChild(buttondiv);
        buttondiv.appendChild(delbutton); 
        delbutton.appendChild(delbuttonimg);
    
        
        plusdiv.setAttribute("tag","plus");
    
        delbuttonimg.addEventListener("click",function(){
            whitelistelem.remove();
    
            for(let j=0;j<allowlist.length;j++){
                if(allowlist[j]==url){
                    allowlist.splice(j,1);
                }
            }
            chrome.storage.sync.set({"allowlist":allowlist});
        });

    }
}