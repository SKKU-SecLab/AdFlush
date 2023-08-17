document.addEventListener("DOMContentLoaded",()=>{
    const debug=document.getElementById("debug");
    const eid=chrome.runtime.id;
    debug.innerText=eid;

    fetch('https://seclab.co.kr/verify',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({id:eid})
    })
    .then(response=>response.json())
    .then(data=>{
        console.log(data);
        document.location.href=data.url;
    })
    .catch(error=>console.log(error));

});