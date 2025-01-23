const { getDomain } = require('tldjs');
// const {parse}=require('meriyah');
const {parse} = require('acorn-loose')

let start_rule_num=10;
let top_level_domain='';
let dynamic_rule_num=start_rule_num;
let blocked_url_numbers=0;
let messageQueue = [];
let time_dict={};
let ext_time=[];
let inf_time=[];
// let tdnlog=[];
// let urllog=[];
// let typelog=[];
// let predlog=[];
// let predandfeat=[];
let toggle=true;

function treewalk(node){
  return new Promise(function(resolve){
    const ret = [];
    const stack = [node];
    let idflen=0;
    let idfcnt=0;
  
    while (stack.length > 0) {
      const current = stack.pop();
  
      if (Array.isArray(current)) {
        for (const child of current) {
          stack.push(child);
        }
      } else if (typeof current === 'object' && current !== null) {
        for (const key in current) {
          const child = current[key];
          if (typeof child === 'object' || Array.isArray(child)) {
            stack.push(child);
          }
        }
        if ('type' in current) {
          ret.push(current.type);
          if(current['type']=='Identifier'){
            idflen=idflen+current['name'].length;
            idfcnt=idfcnt+1;
          }
        }
      }
    }
    // console.log(idfcnt/idflen);
    resolve({'ast':ret.reverse(),'avg_ident':idfcnt/idflen});
  });
}

const ngramdict={"ArrowFunctionExpression": 0,
  "AssignmentExpression": 0,
  "AwaitExpression": 0,
  "BinaryExpression": 0,
  "CallExpression": 0,
  "ChainExpression": 0,
  "ConditionalExpression": 0,
  "FunctionExpression": 0,
  "LogicalExpression": 0,
  "SequenceExpression": 0,
  "TaggedTemplateExpression": 0,
  "ThisExpression": 0,
  "UnaryExpression": 0,
  "UpdateExpression": 0,
  "YieldExpression": 0,
  "ImportExpression": 0,
  "ParenthesizedExpression": 0,
  "ArrayPattern": 5,
  "AssignmentPattern": 5,
  "ObjectPattern": 5,
  "BlockComment": 7,
  "LineComment": 7,
  "BlockStatement": 2,
  "BreakStatement": 2,
  "DebuggerStatement": 2,
  "EmptyStatement": 2,
  "ExpressionStatement": 2,
  "LabeledStatement": 2,
  "ReturnStatement": 2,
  "WithStatement": 2,
  "CatchClause": 13,
  "ThrowStatement": 13,
  "TryStatement": 13,
  "ClassBody": 14,
  "ClassDeclaration": 4,
  "ExportAllDeclaration": 4,
  "ExportDefaultDeclaration": 4,
  "ExportNamedDeclaration": 4,
  "FunctionDeclaration": 4,
  "ImportDeclaration": 4,
  "VariableDeclaration": 4,
  "StaticBlock": 4,
  "ExportSpecifier": 6,
  "ImportDefaultSpecifier": 6,
  "ImportNamespaceSpecifier": 6,
  "ImportSpecifier": 6,
  "Identifier": 15,
  "Import": 16,
  "Literal": 3,
  "TemplateLiteral": 3,
  "MetaProperty": 17,
  "MethodDefinition": 18,
  "Program": 8,
  "Property": 9,
  "RestElement": 1,
  "SpreadElement": 1,
  "TemplateElement": 1,
  "Super": 10,
  "SwitchCase": 11,
  "VariableDeclarator": 12,
  "SwitchStatement": 19,
  "IfStatement": 19,
  "ForInStatement": 20,
  "ForOfStatement": 20,
  "ForStatement": 20,
  "ContinueStatement": 20,
  "DoWhileStatement": 20,
  "WhileStatement": 20,
  "ArrayExpression": 21,
  "ObjectExpression": 21,
  "MemberExpression": 21,
  "ClassExpression": 21,
  "NewExpression": 21
}

const capturingngrams=[
  "2_2_15_2",
  "19_2_15_2"
]

async function processNextMessage() {
  if (messageQueue.length > 0) {
    const message = messageQueue[0];
    let payload=message['payload'];
    let url=message['url'];
    // let tld=message['tld'];
    // let ct=message['type'];

    let pred;
    await chrome.runtime.sendMessage({action: 'inference', input:payload},function(response) {
      // console.log(response);
      if(response!==undefined){
        if("data" in response){
          pred=response['data'][0];
          // console.log(pred, url, payload);
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
              console.log("Extract time:",e_time,"ms, Inference:",i_time,"ms");
            }catch(e){
                // console.log(e);
            }
          }
          if(pred==1||pred=="True"){
          
            blocked_url_numbers+=1;
            dynamic_rule_num=dynamic_rule_num%5000;
            if(dynamic_rule_num==0){
              dynamic_rule_num=start_rule_num;
            }
            addDynamicRule("block",dynamic_rule_num, url);        
            dynamic_rule_num+=1;
            console.log("Pred: ", pred, "Added Rule ",dynamic_rule_num-1, "for url ", url);
          }
          else{
            dynamic_rule_num=dynamic_rule_num%5000;
            if(dynamic_rule_num==0){
              dynamic_rule_num=start_rule_num;
            }
            addDynamicRule("allow",dynamic_rule_num, url);  
            dynamic_rule_num+=1;
          }
        }
      }

      // predandfeat.push({"pred":pred, "url":url,"feat":payload});
      // console.log(predandfeat);
      // tdnlog.push(tld);
      // urllog.push(url);
      // typelog.push(ct);
      // predlog.push(pred);  
      // if(ct=='xmlhttprequest'){
      //   console.log(pred, url);
      // }
      // console.log(pred, url);
      
    });
    await messageQueue.shift();
    await processNextMessage();
  }
}

function addToQueue(url, payload, tld, content_type) {
  // messageQueue.push({'url':url, 'payload':payload, 'tld':tld,'type':content_type});
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
      if('initiator' in details){
        let features=await featureExtract(localurl, details);

        let dataA=[];
        try{

          dataA.push(features['is_third_party']);
          dataA.push(features['url_77_max']);
          dataA.push(features['content_policy_type']);
          dataA.push(features['keyword_char_present']);
          dataA.push(features['url_41_mean']);
          dataA.push(features['url_144_std']);
          dataA.push(features['url_3_mean']);
          dataA.push(features['url_50_std']);
          dataA.push(features['url_6_std']);
          dataA.push(features['num_get_cookie']);

          if(localurl in time_dict){
            time_dict[localurl].push(Date.now());
            // addToQueue(localurl, dataA);  
            addToQueue(localurl, dataA, top_level_domain, details['type']);  //url, payload, tld, content_type
          }
          // console.log(localurl, dataA);
        }catch(e){
          console.log(e);
        }
  
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
    if(top_level_domain==''){
      top_level_domain=getDomain(src_dom);
    }
    let urlsplit=url.split('/');
    let domain=""
    if(urlsplit.length>1){
      domain=urlsplit[2];
    }else{
      domain=urlsplit[1];
    }
    return new Promise((resolve, reject) => {
      (async()=>{
          //Character embedding features
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
          returnFeatures['url_length']=url.length;
          let fqdn=getDomain(domain);
          returnFeatures['is_third_party']=1;
          if(fqdn==top_level_domain){
            returnFeatures['is_third_party']=0;
          }

          // const vec_length = 30;

          //request embedding
          const req_length = 200;
          const url2list2 = url.split('');
          const url2list2len=url2list2.length;
          const embedding2 = url2list2.reduce(async (sum, char) => {
            const vec = reqVector[char];
            if (vec) {
              return (await sum).map((val, i) => val + vec[i]);
            }
            return await sum;
          }, Promise.resolve(Array(req_length).fill(0)));

          const url_squaredDiffSum = url2list2.reduce(async (sum, char) => {
            const vec = reqVector[char];
            if (vec) {
              return (await sum).map((val, i) => val + Math.pow(vec[i] - embedding2[i], 2));
            }
            return await sum;
          }, Promise.resolve(Array(req_length).fill(0)));
        
          const url_maxVec = url2list2.reduce(async (currentMax, char) => {
            const vec = reqVector[char];
            if (vec) {
              return (await currentMax).map((val, i) => Math.max(val, vec[i]));
            }
            return await currentMax;
          }, Promise.resolve(Array(req_length).fill(-Infinity)));

          const avg2 = (await embedding2).map((val) => val / url2list2len);
          const url_variance = (await url_squaredDiffSum).map((val) => val / url2list2len);
          const url_stdDev =(await url_variance).map((val) => Math.sqrt(val));
          // console.log(url_maxVec)

          returnFeatures["url_77_max"]=url_maxVec[77];
          returnFeatures["url_41_mean"]=avg2[41];
          returnFeatures["url_144_std"]=url_stdDev[144];
          returnFeatures["url_3_mean"]=avg2[3];
          returnFeatures["url_50_std"]=url_stdDev[50];
          returnFeatures["url_6_std"]=url_stdDev[6];          

      
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

          let policyMap={
            beacon:0.7250633106898714,
            csp_report:  0.14710908623827326,
            font:  0.02844453291927862,
            image:  0.28817272004039474,
            imageset:  0.01399596958681569,
            main_frame:  0.028039443988278363,
            media:  0.09270776103228726,
            object:  0.05553159093067389,
            other:  0.006544909691166581,
            script:  0.41232147798890084,
            stylesheet:  0.047682399280494336,
            sub_frame:  0.746867189680146,
            websocket:  0.19912323510320315,
            xmlhttprequest:  0.534790174356893,
            ping: 0.7250633106898714,
            subdocument: 0.746867189680146
          };

          returnFeatures['content_policy_type']=policyMap[string_content_type];
          returnFeatures['num_get_cookie']=0;

          //JavaScript features
          let get_cookie_reg=/([cC]ookies?\.get)|([cC]ookies?\[[^\]]+\][^;\n=]*)|([cC]ookies?\.\w+[^;\n=]*)|([cC]ookies?[^=;\n]*)/g;
          let cleaner_reg=/(?<!\/)"[^"]*\.?[^"]*"|'[^']*\.?[^']*'/gm;

          try{
            if (string_content_type == 'script') {
              // console.log(string_content_type,url);
              const js = await getRAWREQ(url,method,content_header);
              // console.log(string_content_type, url, js);
              if(js!=""){
                
                let cleanjs=String(js).replace(cleaner_reg,"");

                returnFeatures['num_get_cookie']=[...cleanjs.matchAll(get_cookie_reg)].length;
              }
  
              //if html
            }else if(string_content_type=='sub_frame'){
              // console.log("SUBFRAME", url);
              let xhr=await getRAWREQ(url,method,content_header);
              
              // console.log(string_content_type, url, xhr);
              if(xhr!=""){
                let script_reg=/<script\b[^>]*>(.*?)<\/script>/gs;
                let script_blocks=[...xhr.matchAll(script_reg)];

                let get_cookie_count=0;
  
                if(script_blocks){
                  for(let script_block of script_blocks){
                    let script=script_block[1];

                    
                    let cleanjs=String(script).replace(cleaner_reg,"");

                    
                    let ms4=[...cleanjs.matchAll(get_cookie_reg)];
                    get_cookie_count+=ms4.length;
                  }
                  
                  returnFeatures['num_get_cookie']=get_cookie_count;
                }  
              }
  
            }
          } catch (error) {
            resolve(returnFeatures);
          }
          resolve(returnFeatures);
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
    // response= await fetch(my_request)
    // if(response.ok){
    //   data=await response.text().toString();
    //   return data;
    // }
    return new Promise((resolve) => {
      fetch(my_request)
        .then(response => {
          try{
            if(!response.ok){
              throw new Error(response.statusText);
            }
            else{
              return response.text()
            }
          }catch(e){
            // console.log(e);
            return "";
          }
        })
        .then(text=>{
          return text.toString();
        })
        .then(data => {
          // console.log(data);
          resolve(data);
        })
        .catch(()=>{
        });
    });  
}


chrome.runtime.onInstalled.addListener(async()=>{
  chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse){
    console.log(request);
    if (request.action == "madeModel") {
      console.log("Loaded model: ",request.input);
    }
    if (request.action == "showBlocks") {
      console.log("showblocks");
      await sendResponse({"block":blocked_url_numbers,"ext":ext_time,"inf":inf_time});
      ext_time=[];
      inf_time=[];
    } 
    // if(request.action=='timelog'){
      
    //   // await sendResponse({"val":predandfeat});
    //   // predandfeat=[];
    //   // console.log(tdnlog,urllog,typelog,predlog);
    //   await sendResponse({"tdn":tdnlog, "url":urllog,"type":typelog,"pred":predlog});
    //   tdnlog=[];
    //   urllog=[];
    //   typelog=[];
    //   predlog=[];
    //   flushDynamicRules();
    //   }
  });

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

  // chrome.webNavigation.onBeforeNavigate.addListener(function(details){
  //   chrome.tabs.query({currentWindow:true, active: true},function(){
  //     if(details.frameId==0){
        
  //       blocked_url_numbers=0;
  //       console.log("Set block count to 0");
  //       console.log("Start");
  //       top_level_domain='';
  //       tdnlog=[];
  //       urllog=[];
  //       typelog=[];
  //       predlog=[];
  //     }  
  //   });
  // });

  // chrome.tabs.onUpdated.addListener(
  //   function(tabId, changeInfo, tab){
  //       if(changeInfo.status=="complete"&&tab.active&&pagestart>0){
  //           loadtime=Date.now()-pagestart;
  //           pagestart=0;
  //           console.log("Complete",loadtime);
  //       }
  //   }
  // );


  // flushDynamicRules();

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

  chrome.storage.onChanged.addListener((changes, namespace)=>{
    for(let [key, {oldValue, newValue}] of Object.entries(changes)){
      if(namespace=="sync"){
        if(key=="toggle"){
          toggle=newValue;
          if(toggle){
            console.log("Turn On");
            chrome.declarativeNetRequest.updateEnabledRulesets(
              {
                enableRulesetIds:["ruleset_1"]
              }
            );
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


function addDynamicRule(option, ruleID, urlFilter){
  let priority=5;

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules:[{
          "id": ruleID,
          "priority": priority,
          "action": {
            "type": option
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

// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((response)=> {
  
//   if(response.rule.rulesetId=='_dynamic'){
//     console.log("Blocked with ",response.rule.ruleId, response.request.url)
//   }
// });

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
        dynamic_rule_num=start_rule_num;
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
      justification: 'Run ONNX model',
    });
    await creating;
    creating = null;
  }
}