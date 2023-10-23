import onnx
import onnxruntime as ort
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
import pandas as pd
import time
import argparse
import sys
import h2o

def metrics(true, pred,is_mutated):
    print("Performace Metrics: ")
    print("\tAccuracy: ",accuracy_score(true, pred))
    print("\tPrecision: ",precision_score(true, pred))
    print("\tRecall: ",recall_score(true, pred))
    print("\tF1: ", f1_score(true, pred))
    print("\tROC-AUC:", roc_auc_score(true, pred))
    
    # ASR
    if is_mutated:
        # Number of attacks
        total_attacks = len(true)
        # Number of successful attacks (misclassifications)
        successful_attacks = sum(true != pred)
        asr = successful_attacks / total_attacks
        print("\tAttack Success Rate: ",asr)

    tn, fp, fn, tp = confusion_matrix(true, pred).ravel()        
    # Calculate FNR
    fnr = fn / (tp + fn)
    print('\tFalse Negative Rate:', fnr)

    # Calculate FPR
    fpr = fp / (fp + tn)
    print('\tFalse Positive Rate:', fpr)
    
def inference_mojo(input, label, is_mutated):
    h2o.init()
    path = 'model/AdFlush_mojo.zip'
    h2o_model = h2o.import_mojo(path)
    input_frame = h2o.H2OFrame(input)
    print("Running...")
    start_inf=time.time()
    pred = h2o_model.predict(input_frame).as_data_frame().predict.to_list()
    print("Inference time elapsed: ", time.time()-start_inf, "for ", len(label), " samples.")
    h2o.shutdown()
    metrics(label.astype(int), pred, is_mutated)
    
def inference_onnx(input, label, is_mutated):
    # Check that the IR is well formed
    model=onnx.load('model/AdFlush.onnx')
    try:
        onnx.checker.check_model(model)
    except Exception as e:
        print("Error in loading model: ",e)
        return
    
    # Create an ONNX runtime session
    print("Open ONNX session")
    ort_session = ort.InferenceSession('model/AdFlush.onnx')
    input_data = input.values.astype('float32')
    input_name = ort_session.get_inputs()[0].name

    # Run the inference session to get the prediction results
    print("Running...")
    start_inf=time.time()
    pred = ort_session.run(None, {input_name: input_data})
    print("Inference time elapsed: ", time.time()-start_inf, "for ", len(label), " samples.")
    metrics(label.astype(int), pred[0].astype(int), is_mutated)
    
def prepare(dataset, modeltype):
    dataframe=''
    is_mutated=False
    
    if dataset=='train':
        print("Loading train dataset...")
        dataframe=pd.read_csv("dataset/AdFlush_train.csv", index_col=0)
        is_mutated=False
        
    elif dataset=='test':
        print("Loading test dataset...")
        dataframe=pd.read_csv("dataset/AdFlush_test.csv", index_col=0)
        is_mutated=False
        
    elif dataset=='gan':
        print("Loading GAN dataset...")
        dataframe=pd.read_csv("dataset/GAN_mutated_AdFlush.csv", index_col=0)
        is_mutated=True
    elif dataset=='custom_gan':
        print("Loading customized GAN dataset...")
        dataframe=pd.read_csv("dataset/custom_GAN_mutated_adflush.csv", index_col=0)
        is_mutated=True
        
        
    else:
        print("Unavailable dataset...")
        return
    


    input_features=['content_policy_type', 'url_length', 'brackettodot', 'is_third_party',
                    'keyword_char_present', 'num_get_storage', 'num_set_storage',
                    'num_get_cookie', 'num_requests_sent', 'req_url_33', 'req_url_135',
                    'req_url_179', 'fqdn_4', 'fqdn_13', 'fqdn_14', 'fqdn_15', 'fqdn_23',
                    'fqdn_26', 'fqdn_27', 'ng_0_0_2', 'ng_0_15_15', 'ng_2_13_2',
                    'ng_15_0_3', 'ng_15_0_15', 'ng_15_15_15', 'avg_ident',
                    'avg_charperline']
    
    input = dataframe[input_features]
    label=dataframe['label']
    if modeltype=='mojo':
        inference_mojo(input,label,is_mutated)
    elif modeltype=='onnx':
        inference_onnx(input,label,is_mutated)
    else:
        print("Model type error.")
        return
    
def main(program, args):
    #arguements
    parser=argparse.ArgumentParser(description="Evaluate AdFlush")
    parser.add_argument('--dataset',type=str, default='test',choices=['train','test','gan','custom_gan'], help='Dataset to evaluate AdFlush on.')
    parser.add_argument('--modeltype',type=str, default='mojo',choices=['mojo','onnx'], help='Model type to use AdFlush.')
    a=parser.parse_args(args)
    prepare(a.dataset, a.modeltype)
    
if __name__=="__main__":
    main(sys.argv[0],sys.argv[1:])