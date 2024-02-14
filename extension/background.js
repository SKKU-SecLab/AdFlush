const { getDomain } = require('tldjs');
// const {parse}=require('meriyah');
const {parse} = require('acorn-loose')

let start_rule_num=10;
let top_level_domain='';
let dynamic_rule_num=start_rule_num;
let blocked_url_numbers=0;
let messageQueue = [];
// let time_dict={};
// let ext_time=[];
// let inf_time=[];
let tdnlog=[];
let urllog=[];
let typelog=[];
let predlog=[];
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

const ngramdict={
  'ArrayExpression': 0,
    'ArrayPattern': 5,
    'ArrowFunctionExpression': 0,
    'AssignmentExpression': 0,
    'AssignmentPattern': 5,
    'AwaitExpression': 0,
    'BinaryExpression': 0,
    'BlockComment': 7,
    'BlockStatement': 2,
    'BreakStatement': 2,
    'CallExpression': 0,
    'CatchClause': 13,
    'ChainExpression':0,
    'ClassBody': 14,
    'ClassDeclaration': 4,
    'ClassExpression': 0,
    'ConditionalExpression': 0,
    'ContinueStatement': 2,
    'DebuggerStatement': 2,
    'DoWhileStatement': 2,
    'EmptyStatement': 2,
    'ExportAllDeclaration': 4,
    'ExportDefaultDeclaration': 4,
    'ExportNamedDeclaration': 4,
    'ExportSpecifier': 6,
    'ExpressionStatement': 2,
    'ForInStatement': 2,
    'ForOfStatement': 2,
    'ForStatement': 2,
    'FunctionDeclaration': 4,
    'FunctionExpression': 0,
    'Identifier': 15,
    'IfStatement': 2,
    'Import': 16,
    'ImportDeclaration': 4,
    'ImportDefaultSpecifier': 6,
    'ImportNamespaceSpecifier': 6,
    'ImportSpecifier': 6,
    'LabeledStatement': 2,
    'LineComment': 7,
    'Literal': 3,
    'LogicalExpression': 0,
    'MemberExpression': 0,
    'MetaProperty': 17,
    'MethodDefinition': 18,
    'NewExpression': 0,
    'ObjectExpression': 0,
    'ObjectPattern': 5,
    'Program': 8,
    'Property': 9,
    'RestElement': 1,
    'ReturnStatement': 2,
    'SequenceExpression': 0,
    'SpreadElement': 1,
    'Super': 10,
    'SwitchCase': 11,
    'SwitchStatement': 2,
    'TaggedTemplateExpression': 0,
    'TemplateElement': 1,
    'TemplateLiteral': 3,
    'ThisExpression': 0,
    'ThrowStatement': 2,
    'TryStatement': 2,
    'UnaryExpression': 0,
    'UpdateExpression': 0,
    'VariableDeclaration': 4,
    'VariableDeclarator': 12,
    'WhileStatement': 2,
    'WithStatement': 2,
    'YieldExpression': 0,
	'StaticBlock' :  4,
	'ImportExpression' :  0,
	'ParenthesizedExpression' :  0,
}

async function processNextMessage() {
  if (messageQueue.length > 0) {
    const message = messageQueue[0];
    let payload=message['payload'];
    let url=message['url'];
    let tld=message['tld'];
    let ct=message['type'];

    let pred;
    await chrome.runtime.sendMessage({action: 'inference', input:payload},function(response) {
      // console.log(response);
      pred=response['data'][0];
      // console.log(pred, url, payload);
        // let times=time_dict[url];
        // if(times&&times.length==2){
        //   try{
        //     let now=Date.now();
        //     let e_time=times[1]-times[0];
        //     let i_time=now-times[1];
        //     if(isNaN(e_time)){
        //       e_time=0;
        //     }
        //     if(isNaN(i_time)){
        //       i_time=0;
        //     }
        //     ext_time.push(e_time);
        //     inf_time.push(i_time);
        //     delete time_dict[url];
        //     // console.log("Extract:",e_time,"Inference:",i_time);
        //   }catch(e){
        //     // console.log(e);
        //   }
        // }
      // predandfeat.push({"pred":pred, "url":url,"feat":payload});
      // console.log(predandfeat);
      tdnlog.push(tld);
      urllog.push(url);
      typelog.push(ct);
      predlog.push(pred);  
      // if(ct=='xmlhttprequest'){
      //   console.log(pred, url);
      // }
      // console.log(pred, url);
      if(pred=='True'){
        
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
    });
    await messageQueue.shift();
    await processNextMessage();
  }
}

function addToQueue(url, payload, tld, content_type) {
  messageQueue.push({'url':url, 'payload':payload, 'tld':tld,'type':content_type});
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
      // let temparray=[];
      // temparray.push(Date.now());
      // time_dict[localurl]=temparray;
      if('initiator' in details){
        let features=await featureExtract(localurl, details);

        let dataA=[];
        try{
          dataA.push(features['content_policy_type']);
          dataA.push(features['url_length']);
          dataA.push(features['brackettodot']);
          dataA.push(features['is_third_party']);
          dataA.push(features['keyword_char_present']);
          dataA.push(features['num_get_storage']);
          dataA.push(features['num_set_storage']);
          dataA.push(features['num_get_cookie']);
          dataA.push(features['num_requests_sent']);
          dataA.push(features['reqEmbedding'][33]);
          dataA.push(features['reqEmbedding'][135]);
          dataA.push(features['reqEmbedding'][179]);
          dataA.push(features['fqdnEmbedding'][4]);
          dataA.push(features['fqdnEmbedding'][13]);
          dataA.push(features['fqdnEmbedding'][14]);
          dataA.push(features['fqdnEmbedding'][15]);
          dataA.push(features['fqdnEmbedding'][23]);
          dataA.push(features['fqdnEmbedding'][26]);
          dataA.push(features['fqdnEmbedding'][27]);
          dataA.push(features['ng_0_0_2']);
          dataA.push(features['ng_0_15_15']);
          dataA.push(features['ng_2_13_2']);
          dataA.push(features['ng_15_0_3']);
          dataA.push(features['ng_15_0_15']);
          dataA.push(features['ng_15_15_15']);
          dataA.push(features['avg_ident']);
          dataA.push(features['avg_charperline']);
          // if(localurl in time_dict){
          //   time_dict[localurl].push(Date.now());
          //   addToQueue(localurl, dataA);  
          // }
          addToQueue(localurl, dataA, top_level_domain, details['type']);  //url, payload, tld, content_type
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
          console.log(returnFeatures['is_third_party'], "tld:", top_level_domain, "srcdom:", getDomain(src_dom),"fqdn:",fqdn, "url:", url);
          returnFeatures['fqdnEmbedding']=Array(30).fill(0);
          returnFeatures['reqEmbedding']=Array(200).fill(0);
          //source embedding
          const vec_length = 30;
          try{
            const url2list = top_level_domain.split('');
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
          // console.log(domain, returnFeatures['fqdnEmbedding']);
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
            object: 0.08000072,
            websocket: 0.25831702,
            other: 0.033045977,
            media: 0.16989118,
            beacon: 0.95697004,
            ping:0.95697004,
            csp_report: 0.14572865,
            sub_frame: 0.74215454,
            subdocument:0.74215454,
            imageset: 0.01751194,
            main_frame: 0.03602579,
            xmlhttprequest: 0.5052196,
            stylesheet: 0.07897147,
            script: 0.4748115,
            image: 0.38471517,
            font: 0.109323405
          };
          returnFeatures['content_policy_type']=policyMap[string_content_type];
          returnFeatures['num_get_cookie']=0;

          //JavaScript features
          //if js
          let requestreg=/https?:\/\//g;
          let set_storage_reg=/([sS]torage\.setItem)|([sS]torage\[[^\]]+\][^;\n]*=)|([sS]torage\.[^=;\n]+=)|([sS]torage[^;\n]*=)/g;
          let get_storage_reg=/([sS]torage\.get)|([sS]torage\[[^\]]+\][^;\n=]*)|([sS]torage\.\w+[^;\n=]*)|([sS]torage[^;\n=]*)/g;
          let get_cookie_reg=/([cC]ookies?\.get)|([cC]ookies?\[[^\]]+\][^;\n=]*)|([cC]ookies?\.\w+[^;\n=]*)|([cC]ookies?[^=;\n]*)/g;
          let cleaner_reg=/(?<!\/)"[^"]*\.?[^"]*"|'[^']*\.?[^']*'/gm;

          returnFeatures['num_requests_sent']=0;
          returnFeatures['num_set_storage']=0;
          returnFeatures['num_get_storage']=0;
          returnFeatures['brackettodot']=0;
          returnFeatures['avg_ident']=0;
          returnFeatures['avg_charperline']=0;
          returnFeatures['ng_0_0_2']=0;
          returnFeatures['ng_0_15_15']=0;
          returnFeatures['ng_2_13_2']=0;
          returnFeatures['ng_15_0_3']=0;
          returnFeatures['ng_15_0_15']=0; 
          returnFeatures['ng_15_15_15']=0;
          try{
            if (string_content_type == 'script') {
              // console.log(string_content_type,url);
              const js = await getRAWREQ(url,method,content_header);
              // console.log(string_content_type, url, js);
              if(js!=""){
                try{
                  const ast=parse(js,{ecmaVersion: 2022});
                  // console.log(ast);
                  const traversal=await treewalk(ast);
                  
                  // console.log(traversal['ast'], js);
                  if('ast' in traversal){
                    const gramsource=traversal['ast'];
                    let ngram={};
                    let ngramsum=0;
                    if(gramsource.length>2){
                      ngramsum=gramsource.length-2;
                      for(let i=2;i<gramsource.length;i++){
                        let pattern=String(ngramdict[gramsource[i-2]])+'_'+String(ngramdict[gramsource[i-1]]+'_'+String(ngramdict[gramsource[i]]))
                        if(pattern=='0_0_2'||pattern=='0_15_15'||pattern=='2_13_2'||pattern=='15_0_3'||pattern=='15_0_15'||pattern=='15_15_15'){
                          if(pattern in ngram){
                            ngram[pattern]=ngram[pattern]+1;
                          }
                          else{
                            ngram[pattern]=1;
                          }  
                        }
                      }  
                    }
                    for(let i in ngram){
                      ngram[i]=ngram[i]/ngramsum;
                    } 
    
                    if('0_0_2' in ngram){
                      returnFeatures['ng_0_0_2']=ngram['0_0_2'];
                    }
                    if('0_15_15' in ngram){
                      returnFeatures['ng_0_15_15']=ngram['0_15_15'];
                    }
                    if('2_13_2' in ngram){
                      returnFeatures['ng_2_13_2']=ngram['2_13_2'];
                    }
                    if('15_0_3' in ngram){
                      returnFeatures['ng_15_0_3']=ngram['15_0_3'];
                    }
                    if('15_0_15' in ngram){
                      returnFeatures['ng_15_0_15']=ngram['15_0_15'];
                    }
                    if('15_15_15' in ngram){
                      returnFeatures['ng_15_15_15']=ngram['15_15_15'];
                    }
    
                    returnFeatures['avg_ident']=traversal['avg_ident'];
                    // console.log("Parse good", returnFeatures);
                  }  
                }
                catch(exception){
                  // console.log(exception);
                }
                let cleanjs=String(js).replace(cleaner_reg,"");

                let brackets=cleanjs.split(/\[|\]|\(|\)/).length -1;
                let dots=cleanjs.split(/\./).length-1;
                if(dots>0 && brackets >0){
                  returnFeatures['brackettodot']=brackets/dots;
                }
                returnFeatures['num_requests_sent']=[...js.matchAll(requestreg)].length;
                returnFeatures['num_set_storage']=[...cleanjs.matchAll(set_storage_reg)].length;
                returnFeatures['num_get_storage']=[...cleanjs.matchAll(get_storage_reg)].length;
                returnFeatures['num_get_cookie']=[...cleanjs.matchAll(get_cookie_reg)].length;
                let lines=js.split('\n').length;
                if(lines>0){
                  returnFeatures['avg_charperline']=js.length/lines;
                }
              }
  
              //if html
            }else if(string_content_type=='sub_frame'){
              // console.log("SUBFRAME", url);
              let xhr=await getRAWREQ(url,method,content_header);
              
              // console.log(string_content_type, url, xhr);
              if(xhr!=""){
                let script_reg=/<script\b[^>]*>(.*?)<\/script>/gs;
                let script_blocks=[...xhr.matchAll(script_reg)];
                let match_count=0
                let str_match_count=0;
                let get_match_count=0;
                let get_cookie_count=0;
                let ngram={};
                let ngramsum=0;
                let avg_identlen=0;
                let brackettodot=0;
                let charperline=0;
  
                if(script_blocks){
                  for(let script_block of script_blocks){
                    let script=script_block[1];

                    try{
                      const ast=parse(script,{ecmaVersion:2022});
                      const traversal=await treewalk(ast);
                      if('ast' in traversal){
                        const gramsource=traversal['ast'];
                        if(gramsource.length>2){
                          for(let i=2;i<gramsource.length;i++){
                            let pattern=String(ngramdict[gramsource[i-2]])+'_'+String(ngramdict[gramsource[i-1]]+'_'+String(ngramdict[gramsource[i]]))
                            if(pattern=='0_0_2'||pattern=='0_15_15'||pattern=='2_13_2'||pattern=='15_0_3'||pattern=='15_0_15'||pattern=='15_15_15'){
                              ngramsum=ngramsum+1;
                              if(pattern in ngram){
                                ngram[pattern]=ngram[pattern]+1;
                              }
                              else{
                                ngram[pattern]=1;
                              }  
                            }
                          }  
                        }
                        let identlen=traversal['avg_ident'];
                        if(identlen>avg_identlen){
                          avg_identlen=identlen;
                        }
                      }  
                    }
                    catch(exception){
                      // console.log(exception);
                    }
                    let cleanjs=String(script).replace(cleaner_reg,"");

                    let btod=0;
                    let brackets=cleanjs.split(/\[|\]|\(|\)/).length -1;
                    let dots=cleanjs.split('.').length-1;
                    if(dots>0 && brackets >0){
                      btod=brackets/dots;
                    }
                    if(btod>brackettodot){
                      brackettodot=btod;
                    }
                    let lines=script.split('\n').length;
                    let cperl=0;
                    if(lines>0){
                      cperl=script.length/lines;
                    }
                    if(cperl>charperline){
                      charperline=cperl;
                    }
    
                    let ms=[...script.matchAll(requestreg)];
                    match_count+=ms.length;
                    let ms2=[...cleanjs.matchAll(set_storage_reg)];
                    str_match_count+=ms2.length;
                    let ms3=[...cleanjs.matchAll(get_storage_reg)];
                    get_match_count+=ms3.length;
                    let ms4=[...cleanjs.matchAll(get_cookie_reg)];
                    get_cookie_count+=ms4.length;
                  }
                  for(let i in ngram){
                    ngram[i]=ngram[i]/ngramsum;
                  } 
    
                  if('0_0_2' in ngram){
                    returnFeatures['ng_0_0_2']=ngram['0_0_2'];
                  }
                  if('0_15_15' in ngram){
                    returnFeatures['ng_0_15_15']=ngram['0_15_15'];
                  }
                  if('2_13_2' in ngram){
                    returnFeatures['ng_2_13_2']=ngram['2_13_2'];
                  }
                  if('15_0_3' in ngram){
                    returnFeatures['ng_15_0_3']=ngram['15_0_3'];
                  }
                  if('15_0_15' in ngram){
                    returnFeatures['ng_15_0_15']=ngram['15_0_15'];
                  }
                  if('15_15_15' in ngram){
                    returnFeatures['ng_15_15_15']=ngram['15_15_15'];
                  }
    
                  returnFeatures['num_requests_sent']=match_count;
                  returnFeatures['num_set_storage']=str_match_count;
                  returnFeatures['num_get_storage']=get_match_count;
                  returnFeatures['num_get_cookie']=get_cookie_count;
                  returnFeatures['avg_ident']=avg_identlen;
                  returnFeatures['brackettodot']=brackettodot;
                  returnFeatures['avg_charperline']=charperline;
                  // console.log("Parse good", returnFeatures);
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
            console.log(e);
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
        console.log("Start");
        top_level_domain='';
        tdnlog=[];
        urllog=[];
        typelog=[];
        predlog=[];
      }  
    });
  });

  // chrome.tabs.onUpdated.addListener(
  //   function(tabId, changeInfo, tab){
  //       if(changeInfo.status=="complete"&&tab.active&&pagestart>0){
  //           loadtime=Date.now()-pagestart;
  //           pagestart=0;
  //           console.log("Complete",loadtime);
  //       }
  //   }
  // );


  chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse){
    console.log(request);
    if (request.action == "madeModel") {
      console.log("Loaded model: ",request.input);
    }
    // if (request.action == "showBlocks") {
    //   await sendResponse({"block":blocked_url_numbers,"ext":ext_time,"inf":inf_time});
    //   ext_time=[];
    //   inf_time=[];
    // } 
    if(request.action=='timelog'){
      
      // await sendResponse({"val":predandfeat});
      // predandfeat=[];
      // console.log(tdnlog,urllog,typelog,predlog);
      await sendResponse({"tdn":tdnlog, "url":urllog,"type":typelog,"pred":predlog});
      tdnlog=[];
      urllog=[];
      typelog=[];
      predlog=[];
      flushDynamicRules();
      }
  });

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
      justification: 'reason for needing the document',
    });
    await creating;
    creating = null;
  }
}