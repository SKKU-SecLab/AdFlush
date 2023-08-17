document.addEventListener("DOMContentLoaded", () => {
    const back_b=document.getElementById("back");
    back_b.addEventListener("click",function(){
        document.location.href="report.html";
    });

    const history_b=document.getElementById("history");
    history_b.addEventListener("click",function(){
        document.location.href="history.html";
    });

    const setting_b=document.getElementById("setting");
    setting_b.addEventListener("click",function(){
      document.location.href="customlist.html";
    });

    const report_b=document.getElementById("report");
    report_b.addEventListener("click",function(){
        document.location.href="report.html";
    });

    const dropbox=document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover",dragover, false);
    dropbox.addEventListener("drop", drop, false);
});

function dragenter(event){
    event.stopPropagation();
    event.preventDefault();
}
function dragover(event){
    event.stopPropagation();
    event.preventDefault();
}

function drop(event){
    event.stopPropagation();
    event.preventDefault();

    const data=event.dataTransfer;
    const file=data.files[0];
    const message=document.getElementById("message");

    if(String(file.name).endsWith(".txt")&&String(file.type)=="text/plain"){
        const reader=new FileReader();
        reader.onload=(e)=>{

            const upload_b=document.getElementById("uploadbutton");
            const upload_t=document.getElementById("upload");

            upload_b.setAttribute("style","width: 30%; height:25px; margin-top:15px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 5px; background-color: rgba(240, 248, 255, 0.276);");
            upload_t.setAttribute("style","font-size:14px; color: rgba(240, 248, 255, 0.4)");

            upload_b.removeEventListener("click",upload);

            if(e.isTrusted){
                const fileContext=String(e.target.result);
                const domain_regex=/^@*\|*(((?!-)[A-Za-z0–9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6})/gm;

                const matches=[...fileContext.matchAll(domain_regex)];

                const addlist=[];
                for(let match of matches){
                    if(!addlist.includes(match[1])){
                        addlist.push(match[1]);
                    }
                }
                const len=addlist.length;
                const arraystr=addlist.toString();
                const eid=chrome.runtime.id;

                if(len>0){             
                    message.innerText=String(file.name+"\n"+len+" domains");       
                    upload_b.setAttribute("style", "width: 30%; height:25px; margin-top:15px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 5px; background-color:rgba(240, 248, 255, 0.479)");
                    upload_t.setAttribute("style", "font-size:14px; color: aliceblue");

                    upload_b.addEventListener("click",upload);
                    upload_b.params=[eid, len, arraystr];
                }
                else{
                    message.innerText=String(file.name+" does not contain any valid domain names.");
                }
            }
        }
        reader.readAsText(file);

    }
    else{
        message.innerText=String(file.name+" is not a vaild text file.");
    }
}

function upload(e){
    let eid=e.currentTarget.params[0];
    let len=e.currentTarget.params[1];
    let arraystr=e.currentTarget.params[2];
    
    console.log("UPLOAD");

    let b64_arraystr=btoa(arraystr);
    fetch("http://127.0.0.1:8000/verify",{
        method:"GET",
    })
    .then(response=>response.json())
    .then(data=>{
        const url="http://127.0.0.1:8000/verify/";
        fetch('http://127.0.0.1:8000/upload/',{
            method:'POST',
            headers:{
                'X-CSRFToken':data["X-CSRFToken"],
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                eid:eid,
                length:len,
                payload:b64_arraystr
            })
        })
        .then(response=>response.json())
        .then(data=>{
            if(data.status=="ok"&&data.length==len){
                alert("Upload Complete");
                document.location.href="popup.html";
            }
            else{
                alert("Upload Failed");
            }
        })
        .catch(error=>console.log(error));        
    });
}