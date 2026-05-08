import * as ort from "onnxruntime-web";

// document.addEventListener("DOMContentLoaded", ()=>{
  // let ort;
  let session;
  (async()=>{
    try{
      // ort=require('onnxruntime-web');
      // chrome.runtime.sendMessage({action:"madeModel",input:String(ort)})
      const modelUrl = chrome.runtime.getURL('AdFlush.onnx');
      session = await ort.InferenceSession.create(modelUrl);
      
      chrome.runtime.sendMessage({action:'madeModel', input:session.inputNames});  
    }
    catch(e){
      chrome.runtime.sendMessage({action:'madeModel', input:"Model Import Error"});
    }
  
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.action == "inference") {
        let input = Float32Array.from(request["input"]);
        (async () => {
          try {
            const tensorA = new ort.Tensor("float32", input, [1, 10]);
            const feeds = { input: tensorA };

            const results = await session.run(feeds);

            const dataC = results.label.data;
            sendResponse({ data: dataC, prob: results.probabilities.data });
          } catch (e) {
            sendResponse({ error: String(e) });
          }
        })();
        return true;
      }
    });
  })();
// });

  
