// document.addEventListener("DOMContentLoaded", ()=>{
  let ort;
  let session;
  (async()=>{
    try{
      ort=require('onnxruntime-web');
      session = await ort.InferenceSession.create('./AdFlush.onnx');
      chrome.runtime.sendMessage({action:'madeModel', input:session.inputNames});  
    }
    catch(e){
      chrome.runtime.sendMessage({action:'madeModel', input:"Model Import Error"});
    }
  
    chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse){
      if(request.action=="inference"){
        let input=Float32Array.from(request['input']);
        try{       
          const tensorA = new ort.Tensor('float32', input, [1, 27]);
          const feeds = { input: tensorA };
  
          const results = await session.run(feeds);
  
          const dataC = results.label.data;
          sendResponse({'data':dataC, 'prob':results.probabilities.data});
        }catch (e) {
          sendResponse({'error':String(e)});
        }
      }
    });
  })();
// });

  
