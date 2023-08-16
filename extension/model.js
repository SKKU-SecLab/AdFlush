document.addEventListener("DOMContentLoaded", ()=>{
  (async()=>{
    const ort=require('onnxruntime-web');
    let session;
    
    session = await ort.InferenceSession.create('./deadlock.onnx');
    chrome.runtime.sendMessage({action:'madeModel', input:session.inputNames});
  
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
          sendResponse(String(e));
        }
      }
    });
  })();
});

  
