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
    if(String(file.name).endsWith(".txt")){
        const reader=new FileReader();
        reader.onload=(e)=>{
            if(e.isTrusted){
                const fileContext=String(e.target.result);
                const domain_regex=/^@*\|*(((?!-)[A-Za-z0–9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6})/gm;

                const matches=[...fileContext.matchAll(domain_regex)];

                const addlist=[];
                for(let match of matches){
                    addlist.push(match[1]);
                }
                console.log(addlist);
            }
        }
        reader.readAsText(file);

    }
}