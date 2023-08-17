document.addEventListener("DOMContentLoaded",()=>{
    //const debug=document.getElementById("debug");
    const eid=chrome.runtime.id;
    //debug.innerText=eid;

    const init="http://127.0.0.1:8000/verify/";
    fetch(init,{
        method:"GET"
    })
    .then(response=>response.json())
    .then(data=>{
        //const url='https://seclab.co.kr/verify';
        const url="http://127.0.0.1:8000/verify/";
        fetch(url,{
            method:'POST',
            headers:{
                'X-CSRFToken':data["X-CSRFToken"],
                'Content-Type':'application/json'
            },
            body: JSON.stringify({eid :String(eid)})
        })
        .then(response=>response.json())
        .then(data=>{
            document.location.href=data.polls_url;
        })
        .catch(error=>console.log(error));  
    })
});