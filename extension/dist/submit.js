document.addEventListener("DOMContentLoaded",()=>{
    const debug=document.getElementById("debug");
    const eid=chrome.runtime.id;
    debug.innerText=eid;
});