const { getDomain } = require('tldjs');

let dynamic_rule_num=4;
let blocked_url_numbers=0;
let messageQueue = [];
let time_dict={};
let ext_time=[];
let inf_time=[];

async function processNextMessage() {
  if (messageQueue.length > 0) {
    const message = messageQueue[0];
    let payload=message['payload'];
    let whole_url=message['url'];
    let singleslashreg=/https?:\/[^\/]/;
    let url=whole_url.substring(35);
    if(url[0]=='/'){
      url=url.substring(1);
    }
    if(url.match(singleslashreg)){
      url=url.slice(0,6)+'/'+url.slice(6);
    }

    let pred;
    let prob;
    await chrome.runtime.sendMessage({action: 'inference', input:payload},async function(response) {
      try{
        pred=response['data'];
        prob=response['prob'];

        let times=time_dict[url];
        if(times&&times.length==2){
          try{
            let now=Date.now();
            let e_time=times[1]-times[0];
            let i_time=now-times[1];
            if(e_time==NaN){
              e_time=0;
            }
            if(i_time==NaN){
              i_time=0;
            }
            ext_time.push(e_time);
            inf_time.push(i_time);
            delete time_dict[url];  
          }catch(e){
          }
        }
      }catch(e){
      }
      if(Number(pred[0])==1){
        blocked_url_numbers+=1;
        dynamic_rule_num=dynamic_rule_num%4996;
        if(dynamic_rule_num==0){
          dynamic_rule_num=4;
        }
        chrome.declarativeNetRequest.updateDynamicRules(
          {
            addRules:[{
                "id": dynamic_rule_num,
                "priority": 5,
                "action": {
                  "type": "block"
                },
                "condition":{
                  "urlFilter":url,
                  "resourceTypes":[
                    "csp_report",
                    "font",
                    "image",
                    "main_frame",
                    "media",
                    "object",
                    "ping",
                    "script",
                    "stylesheet",
                    "sub_frame",
                    "webbundle",
                    "webtransport",
                    "xmlhttprequest",
                    "other"
                  ]
                }
              }
            ],
            removeRuleIds:[dynamic_rule_num]
          }
        );
        
        dynamic_rule_num+=1;
        console.log("Pred: ", Number(pred[0]), "Added Rule ",dynamic_rule_num-1, "for url ", url);
      }
    });
    await messageQueue.shift();
    await processNextMessage();
  }
}

function addToQueue(url, payload) {
  messageQueue.push({'url':url, 'payload':payload});
  if (messageQueue.length == 1) {
    processNextMessage();
  }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  async function(details){
    let url=details['url'];
    let dom=details['initiator'];
    let singleslashreg=/https?:\/[^\/]/;
    if(url.includes("app.requestly.io")&&!url.includes("de_ad_before=daylight")){
      let localurl=url.substring(35);
      if(localurl[0]=='/'){
        localurl=localurl.substring(1);
      }
      if(localurl.match(singleslashreg)){
        localurl=localurl.slice(0,6)+'/'+localurl.slice(6);
      }
      let temparray=[];
      temparray.push(Date.now());
      time_dict[localurl]=temparray;

      let features=await featureExtract(details);

      let dataA=[];
      try{
        dataA.push(features['content_policy_type']);
        dataA.push(features['fqdnEmbedding'][0]);
        dataA.push(features['fqdnEmbedding'][1]);
        dataA.push(features['fqdnEmbedding'][12]);
        dataA.push(features['fqdnEmbedding'][14]);
        dataA.push(features['fqdnEmbedding'][17]);
        dataA.push(features['fqdnEmbedding'][23]);
        dataA.push(features['fqdnEmbedding'][24]);
        dataA.push(features['fqdnEmbedding'][25]);
        dataA.push(features['fqdnEmbedding'][26]);
        dataA.push(features['fqdnEmbedding'][27]);
        dataA.push(features['fqdnEmbedding'][4]);
        dataA.push(features['fqdnEmbedding'][6]);
        dataA.push(features['is_subdomain']);
        dataA.push(features['is_third_party']);
        dataA.push(features['keyword_char_present']);
        dataA.push(features['num_requests_sent']);
        dataA.push(features['num_set_storage']);
        dataA.push(features['reqEmbedding'][121]);
        dataA.push(features['reqEmbedding'][135]);
        dataA.push(features['reqEmbedding'][179]);
        dataA.push(features['reqEmbedding'][18]);
        dataA.push(features['reqEmbedding'][21]);
        dataA.push(features['reqEmbedding'][22]);
        dataA.push(features['reqEmbedding'][33]);
        dataA.push(features['reqEmbedding'][38]);
        dataA.push(features['reqEmbedding'][91]);

        time_dict[localurl].push(Date.now());
        addToQueue(url, dataA);  
      }catch(e){
      }
    }
  },  { urls: ["<all_urls>"] },
  ['requestHeaders']
);

function featureExtract(requestHeader){
    let url=requestHeader['url'];
    let method=requestHeader['method'];
    let content_header=requestHeader['requestHeaders'];
    let singleslashreg=/https?:\/[^\/]/;
    let returnFeatures={};
    url=url.substring(35);
    if(url[0]=='/'){
      url=url.substring(1);
    }
    if(url.match(singleslashreg)){
      url=url.slice(0,6)+'/'+url.slice(6);
    }
    let src_dom=requestHeader['initiator'];
    let urlsplit=url.split('/');
    let domain=""
    if(urlsplit.length>1){
      domain=urlsplit[2];
    }else{
      domain=urlsplit[1];
    }
    return new Promise(async (resolve, reject) => {
        try {
          const [fqdnVector, reqVector] = await Promise.all([
            new Promise((innerResolve) => {
              chrome.storage.local.get('fqdnvec', (storage) => {
                innerResolve(storage['fqdnvec']);
              });
            }),
            new Promise((innerResolve) => {
              chrome.storage.local.get('reqvec', (storage) => {
                innerResolve(storage['reqvec']);
              });
            })
          ]);
          
          //URL features
          let fqdn=getDomain(domain);
          returnFeatures['is_third_party']=1;
          returnFeatures['is_subdomain']=0;
          if(fqdn==domain){
            returnFeatures['is_third_party']=0;
            returnFeatures['is_subdomain']=1;
          }

          //source embedding
          const vec_length = 30;
          try{
            const url2list = src_dom.split('');
            const embedding = url2list.reduce(async (sum, char) => {
              const vec = fqdnVector[char];
              if (vec) {
                return (await sum).map((val, i) => val + vec[i]);
              }
              return await sum;
            }, Promise.resolve(Array(vec_length).fill(0)));
            const avg = (await embedding).map((val) => val / url2list.length);
            returnFeatures['fqdnEmbedding'] = avg;  
          }catch(e){

          }
          //request embedding
          const req_length = 200;
          const url2list2 = url.split('');
          const embedding2 = url2list2.reduce(async (sum, char) => {
            const vec = reqVector[char];
            if (vec) {
              return (await sum).map((val, i) => val + vec[i]);
            }
            return await sum;
          }, Promise.resolve(Array(req_length).fill(0)));
          const avg2 = (await embedding2).map((val) => val / url2list2.length);
          returnFeatures['reqEmbedding'] = avg2;
      
          let keyword_raw = ["ad", "ads", "advert", "popup", "banner", "sponsor", "iframe", "googlead", "adsys", "adser", "advertise", "redirect",
          "popunder", "punder", "popout", "click", "track", "play", "pop", "prebid", "bid", "pb\\.min", "affiliate", "ban", "delivery",
          "promo","tag", "zoneid", "siteid", "pageid", "size", "viewid", "zone_id", "google_afc" , "google_afs"];
          let keyword_char = [".", "/", "&", "=", ";", "-", "_", "/", "*", "^", "?", ";", "|", ","];
          //keyword_char_present
          let keyword_char_present=0;
          let keyword_raw_present=0;
          for(let j=0;j<keyword_raw.length;j++){
            let matches=[...url.matchAll(new RegExp(keyword_raw[j],"ig"))];
        
            if (matches.length>0){
              keyword_raw_present=1;
              for(let i=0;i<matches.length;i++){
                if(matches[i].index-1>=0){
                  let pre=url[matches[i].index-1];
                  if(keyword_char.includes(pre)){
                    keyword_char_present=1;
                    break;
                  }  
                }
              }
              if(keyword_char_present==1){
                break;
              }
            }  
          }
          returnFeatures['keyword_char_present']=keyword_char_present;

        //HTTP Header features
          let string_content_type=requestHeader.type;
          let policyMap = {
            main_frame : 0.036026,
            script : 0.474811,
            sub_frame : 0.742155,
            subdocument : 0.742155,
            image : 0.384715,
            stylesheet : 0.078971,
            font : 0.109323,
            xmlhttprequest : 0.50522,
            beacon : 0.95697,
            ping: 0.95697,
            imageset : 0.017512,
            csp_report : 0.145729,
            media : 0.169891,
            other : 0.033046,
            websocket : 0.258317,
            object : 0.080001
          };
          returnFeatures['content_policy_type']=policyMap[string_content_type];

          //DOM features
          //if js
          let requestreg=/https?:\/\//g;
          let storage_reg=/(localStorage\.setItem)|(localStorage\..*=)/g;
          returnFeatures['num_requests_sent']=0;
          returnFeatures['num_set_storage']=0;

          if (string_content_type === 'script') {
            const js = await getRAWREQ(url,method,content_header);
            let ms=[...js.matchAll(requestreg)];
            returnFeatures['num_requests_sent']=ms.length;

            let ms2=[...js.matchAll(storage_reg)];
            returnFeatures['num_set_storage']=ms2.length;
            //if html
          }else if(string_content_type=='xmlhttprequest'||string_content_type=='sub_frame'){
            let xhr=await getRAWREQ(url,method,content_header);
            xhr=xhr.replace(/\s/g,"");
            let script_reg=/<script[^>]*>[^<]*<\/script>/g;
            let script_blocks=[...xhr.matchAll(script_reg)];
            let match_count=0
            let str_match_count=0;
            if(script_blocks){
              for(let i=0;i<script_blocks.length;i++){
                let script=script_blocks[i][0];
                let ms=[...script.matchAll(requestreg)];
                match_count+=ms.length;
                let ms2=[...script.matchAll(storage_reg)];
                str_match_count+=ms2.length;
              }
              returnFeatures['num_requests_sent']=match_count;
              returnFeatures['num_set_storage']=str_match_count;
            }
          }
          resolve(returnFeatures);
        } catch (error) {
          reject(error);
        }
    });
}

function getRAWREQ(url, meth, header) {
    let requrl=url;
    if(url.includes('?')){
        requrl=requrl+'&de_ad_before=daylight';
    }else{
        requrl=requrl+'?de_ad_before=daylight';
    }
    let send_header={};
    for(let i=0;i<header.length;i++){
      send_header[header[i].name]=header[i].value;
    }
    let my_request;
    if(meth=='HEAD'||meth=="GET"||meth=="POST"){
      my_request=new Request(requrl,{
        mode:'no-cors',
        credentials:'include',
        method:meth,
        headers:send_header
      });  
    }else{
      my_request=new Request(requrl,{
        credentials:'include',
        method:meth,
        headers:send_header
      }); 
    }

    return new Promise((resolve, reject) => {
      fetch(my_request)
        .then(response => {
          let res_text=""
          try{
            if(!response.ok){
              throw new Error(response.statusText);
            }
            else{
              res_text=response.text();
            }
          }catch(e){
          }
          return res_text;
        })
        .then(data => {
          resolve(data);
        })
        .catch(()=>{
        });

    });  
}


chrome.runtime.onInstalled.addListener(async()=>{
  fetch('fqdnwordvec.json')
  .then(response=>response.json())
  .then(response=>{
      let fqdnvector=response;
      
      chrome.storage.local.set({'fqdnvec':fqdnvector},function(){
          console.log("Saved fqdn vector on storage.");
          return fqdnvector;
      });
  });
  fetch('reqwordvec.json')
  .then(response=>response.json())
  .then(response=>{
      let reqvector=response;
      chrome.storage.local.set({'reqvec':reqvector}, function(){
          console.log("Saved req vector on storage.");
          return reqvector;
      });
  });
  await setupOffscreenDocument('offscreen.html');

  chrome.webNavigation.onBeforeNavigate.addListener(function(details){
    chrome.tabs.query({currentWindow:true, active: true},function(){
      if(details.frameId==0){
        blocked_url_numbers=0;
        console.log("Set block count to 0");
      }  
    });
  });

  chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse){
    if (request.action == "madeModel") {
      console.log("Loaded model: ",request.input);
    }
    if (request.action == "showBlocks") {
      sendResponse({"block":blocked_url_numbers,"ext":ext_time,"inf":inf_time});
      ext_time=[];
      inf_time=[];
    }
  });

  chrome.declarativeNetRequest.getDynamicRules({},function(rules){
    let dyn_arr=[];
    for(let i=0;i<rules.length;i++){
      dyn_arr.push(rules[i].id);
    }

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds:dyn_arr
      },
      function(){
        console.log("Flushed dynamic rules");
        dynamic_rule_num=5;
      }
    );
  });

 
}); 

let creating; 
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url === offscreenUrl) {
      return;
    }
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['WORKERS'],
      justification: 'reason for needing the document',
    });
    await creating;
    creating = null;
  }
}