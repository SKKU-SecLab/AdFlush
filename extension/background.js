const { getDomain } = require('tldjs');
const {getSubdomain} =require('tldjs');

let dynamic_rule_num=500;
let allow_rule_num=1;
let blocked_url_numbers=0;
let messageQueue = [];
let time_dict={};
let ext_time=[];
let inf_time=[];
let block_history=[];
let toggle=true;

async function processNextMessage() {
  if (messageQueue.length > 0) {
    const message = messageQueue[0];
    let payload=message['payload'];
    let url=message['url'];

    let pred;
    await chrome.runtime.sendMessage({action: 'inference', input:payload},async function(response) {
      try{
        pred=response['data'];

        let times=time_dict[url];
        if(times&&times.length==2){
          try{
            let now=Date.now();
            let e_time=times[1]-times[0];
            let i_time=now-times[1];
            if(isNaN(e_time)){
              e_time=0;
            }
            if(isNaN(i_time)){
              i_time=0;
            }
            ext_time.push(e_time);
            inf_time.push(i_time);
            delete time_dict[url];  
          }catch(e){
            console.log(e);
          }
        }
      }catch(e){
        console.log(e);
      }
      if(Number(pred[0])==1){
        blocked_url_numbers+=1;
        dynamic_rule_num=dynamic_rule_num%5000;
        if(dynamic_rule_num==0){
          dynamic_rule_num=500;
        }
        let full_domain=getSubdomain(url)+"."+getDomain(url);
        if(!block_history.includes(full_domain)){
          block_history.unshift(full_domain);
        }
        addDynamicRule("block",dynamic_rule_num, url);        
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
    let singleslashreg=/https?:\/[^/]/;
    if(url.includes("app.requestly.io")&&!url.includes("de_ad_before=daylight")&&toggle){
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

      let features=await featureExtract(localurl, details);

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
        addToQueue(localurl, dataA);  
      }catch(e){
        console.log(e);
      }
    }
  },  { urls: ["<all_urls>"] },
  ['requestHeaders']
);

function featureExtract(url, requestHeader){
    let method=requestHeader['method'];
    let content_header=requestHeader['requestHeaders'];
    let returnFeatures={};

    let src_dom=requestHeader['initiator'];
    let urlsplit=url.split('/');
    let domain=""
    if(urlsplit.length>1){
      domain=urlsplit[2];
    }else{
      domain=urlsplit[1];
    }
    return new Promise((resolve, reject) => {
      (async()=>{
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
            console.log(e);
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
          for(let keyword of keyword_raw){
            let matches=[...url.matchAll(new RegExp(keyword,"ig"))];
        
            if (matches.length>0){
              for(let match of matches){
                if(match.index-1>=0){
                  let pre=url[match.index-1];
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
              for(let script_block of script_blocks){
                let script=script_block[0];
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

      })();
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
    for(let header_elem of header){
      send_header[header_elem.name]=header_elem.value;
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

    return new Promise((resolve) => {
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
            console.log(response.statusText);
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
    if(request.action=="saveHistory"){
      if(block_history.length>15){
        block_history=block_history.slice(0,15);
      }
      chrome.storage.session.set({"history":block_history});
    }
  });

  flushDynamicRules();

  //init toggle
  chrome.storage.sync.get({"toggle":true},function(res){
    toggle=res.toggle;
    console.log("Current toggle mode: "+toggle);
    if(toggle){
      chrome.declarativeNetRequest.updateEnabledRulesets(
        {
          enableRulesetIds:["ruleset_1"]
        }
      );
      console.log("Use ruleset 1 (block)");
    }
    else{
      chrome.declarativeNetRequest.updateEnabledRulesets(
        {
          disableRulesetIds:["ruleset_1"]  
        }
      );
      console.log("Use no ruleset");
    }
  });

  //init allowlist
  chrome.storage.sync.get({'allowlist':[]}, function(res){
    if(res.allowlist.length==0){
      console.log("Allowlist Init");
      let default_list=[];
      default_list.push("comic.naver.com");
      default_list.push("www.youtube.com");
      default_list.push("googlevideo.com");
      default_list.push("www.yahoo.com");
      
      chrome.storage.sync.set({'allowlist':default_list});
    }
    else{
      console.log("Allow list:");
      console.log(res.allowlist);

      if(toggle){
        setupAllowlist(res.allowlist);
      }
    }
  });

  //add listener for toggle & allowlist
  chrome.storage.onChanged.addListener((changes, namespace)=>{
    for(let [key, {oldValue, newValue}] of Object.entries(changes)){
      if(namespace=="sync"){
        if(key=="allowlist"){
          let prev=[];
          for(let i=0;i<oldValue.length;i++){
            prev.push(i);
          }
          chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:prev});
  
          let allowlist=newValue;
          setupAllowlist(allowlist);
        }
        else if(key=="toggle"){
          toggle=newValue;
          if(toggle){
            console.log("Turn On");
            chrome.declarativeNetRequest.updateEnabledRulesets(
              {
                enableRulesetIds:["ruleset_1"]
              }
            );

            chrome.storage.sync.get({'allowlist':[]}, function(res){
              setupAllowlist(res.allowlist);
            });
          }

          else{
            console.log("Turn Off");
            chrome.declarativeNetRequest.updateEnabledRulesets(
              {
                disableRulesetIds:["ruleset_1"]  
              }
            );
            
            flushDynamicRules();
          }
        }
      }
    }
  });
}); 

function setupAllowlist(a_list){
  allow_rule_num=1;
  for(let rule of a_list){
    addDynamicRule("allow",allow_rule_num, String("||"+rule));
    allow_rule_num=allow_rule_num+1;
    console.log(rule+" allowed");
  }
}

function addDynamicRule(option, ruleID, urlFilter){
  let priority=5;
  if(option=="allow"){
    priority=9;
  }

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules:[{
          "id": ruleID,
          "priority": priority,
          "action": {
            "type": "allow"
          },
          "condition":{
            "urlFilter":urlFilter,
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
      removeRuleIds:[ruleID]
    }
  );
}

function flushDynamicRules(){
  chrome.declarativeNetRequest.getDynamicRules({},function(rules){

    let dyn_arr=[];
    for(let rule of rules){
      dyn_arr.push(rule.id);
    }

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds:dyn_arr
      },
      function(){
        console.log("Flushed dynamic rules");
        dynamic_rule_num=500;
      }
    );
      
  });
}

let creating; 
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const matchedClients = await self.clients.matchAll();
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