import onnx
import onnxruntime as ort
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
import pandas as pd
import time
import argparse
import sys
import os

def metrics(true, pred,is_mutated):
    print("Performace Metrics: ")
    print("\tAccuracy: ",accuracy_score(true, pred))
    print("\tPrecision: ",precision_score(true, pred))
    print("\tRecall: ",recall_score(true, pred))
    print("\tF1: ", f1_score(true, pred))
    
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
    
def inference(input, label, is_mutated):
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
    
def prepare(dataset):
    dataframe=''
    is_mutated=False
    
    if dataset=='train':
        print("Loading train dataset...")
        dataframe=pd.read_csv("dataset/trainset.csv", index_col=0)
        is_mutated=False
        
    elif dataset=='test':
        print("Loading test dataset...")
        dataframe=pd.read_csv("dataset/testset.csv", index_col=0)
        is_mutated=False
        
    elif dataset=='gan':
        print("Loading GAN dataset...")
        dataframe=pd.read_csv("dataset/GAN_mutated_AdFlush.csv", index_col=0)
        is_mutated=True
    else:
        print("Unavailable dataset...")
        return
    
    model=onnx.load('model/AdFlush.onnx')
    # Check that the IR is well formed
    try:
        onnx.checker.check_model(model)
    except Exception as e:
        print("Error in loading model: ",e)
        return

    input_features=['content_policy_type', 'fqdn_0', 'fqdn_1', 'fqdn_12', 'fqdn_14', 
                    'fqdn_17', 'fqdn_23', 'fqdn_24', 'fqdn_25', 'fqdn_26', 
                    'fqdn_27', 'fqdn_4', 'fqdn_6', 'is_subdomain', 'is_third_party', 
                    'keyword_char_present', 'num_requests_sent', 'num_set_storage', 'req_url_121', 'req_url_135', 
                    'req_url_179', 'req_url_18', 'req_url_21', 'req_url_22', 'req_url_33', 
                    'req_url_38', 'req_url_91']
    
    input = dataframe[input_features]
    label=dataframe['label']
    inference(input,label,is_mutated)
    
def main(program, args):
    #arguements
    parser=argparse.ArgumentParser(description="Evaluate AdFlush")
    parser.add_argument('--dataset',type=str, default='test',choices=['train','test','gan'], help='Dataset to evaluate AdFlush on.')
    a=parser.parse_args(args)
    prepare(a.dataset)
    
if __name__=="__main__":
    main(sys.argv[0],sys.argv[1:])