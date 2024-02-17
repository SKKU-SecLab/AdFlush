import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr, pointbiserialr
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import RFECV
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve
)
import json
import seaborn as sns
import yaml
import os
import sys
import argparse
import onnx
import onnxruntime as ort
import onnxmltools
import time
import h2o
from h2o.automl import H2OAutoML
import matplotlib.pyplot as plt
from tabgan.sampler import GANGenerator
from adflush_encodings import *

DATADIR=os.path.join(os.getcwd(),os.pardir,"dataset")
MODELDIR=os.path.join(os.getcwd(),os.pardir,"model")
OUTDIR=os.path.join(os.getcwd(),os.pardir,"output")

dataset_dict={
    'trainset':os.path.join(DATADIR, "AdFlush_train.csv"),
    'testset':os.path.join(DATADIR, "AdFlush_test.csv"),
    'gan':os.path.join(DATADIR, "GAN_mutated_AdFlush.csv"),
    'gnirts':os.path.join(DATADIR, "JS_obfuscated_gnirts.csv"),
    'javascript-obfuscator':os.path.join(DATADIR, "JS_obfuscated_javascript_obfuscator.csv"),
    'wobfuscator':os.path.join(DATADIR, "JS_obfuscated_wobfuscator.csv"),
    'custom-gan':os.path.join(DATADIR, "custom_GAN_mutated_adflush.csv")
}

def main(program, argv):
    main_parser=argparse.ArgumentParser(description="Run AdFlush Experiments")
    main_parser.add_argument("-p", type=str, required=True, help="Experiment process you want to run", choices=[
        'feature-eng',
        'model-sel',
        'performance-eval',
        'train-gan',
        'extract-new-feat'
    ])        

    main_parser.add_argument("-d", type=str, default="testset", help="Specify dataset during 'performance-eval'", choices=[
        'testset',
        'gan',
        'gnirts',
        'javascript-obfuscator',
        'wobfuscator',
        'custom-gan'
    ])
    
    main_parser.add_argument("-m", type=str, default="onnx", help="Specify model during 'performance-eval' *For custom, follow model-sel process first.", choices=[
        'mojo',
        'onnx',
        'custom_mojo',
        'custom_onnx'
    ])

    main_parser.add_argument("-s", type=str, default="adflush", help="Specify model during 'train-gan'", choices=[
        'adflush',
        'webgraph',
        'adgraph'
    ])

    main_args=main_parser.parse_args()
    
    if main_args.p=="feature-eng":
        feature_engineering()
    elif main_args.p=="model-sel":
        model_selection()
    elif main_args.p=="performance-eval":
        if main_args.m.startswith('custom'):
            if main_args.m.endswith('mojo'):
                if not os.path.isdir(os.path.join(MODELDIR, "AdFlush_custom")):
                    print("No custom mojo file detected.")
                    return
            elif main_args.m.endswith('onnx'):
                if not os.path.isfile(os.path.join(MODELDIR, "AdFlush_custom.onnx")):
                    print("No custom onnx file detected.")
                    return
        if main_args.d=="custom-gan":
            if not os.path.isfile(os.path.join(DATADIR, "custom_GAN_mutated_adflush.csv")):
                print("No custom GAN dataset detected.")
                return
        performance_evaluation(main_args.d, main_args.m)
    elif main_args.p=='train-gan':
        trainGAN(main_args.s)    
    elif main_args.p=='extract-new-feat':
        extractJS()
    return
    
def feature_engineering():
    print("[[Feature engineering process of AdFlush]]")
    train_df = pd.read_csv(os.path.join(DATADIR,"all_df_883_train.csv"), index_col=0)
    train_df.drop(columns=['visit_id','name'], inplace=True)
    
    with open(os.path.join('json','content_type_dict.json'),'r') as cjson:
        content_dict=json.loads(cjson.read())
        train_df['content_policy_type']=train_df['content_policy_type'].apply(lambda x: content_dict[x])

    with open('features.yaml') as f:
        features = yaml.full_load(f)
        
    robust_features = features['feature_columns_robustness_new']    # 533 features
    unfeasibleFeatures = features['features_unfeasible'] # 52 features
    
    robust_df=train_df[robust_features].copy()
    robust_df['label']=train_df['label'].copy()
    exist_df=train_df.drop(robust_features+unfeasibleFeatures, axis=1)
    
    #Point-biserial correlation - existing features
    print("[1-1. Point-biserial correlation - existing features]")
    cnt = 0
    filtered_feat = []
    for i in exist_df.columns[:-1]:
        correlation, p_value = pointbiserialr(exist_df.label, exist_df[i])
        if p_value > 0.1:
            print('\t',"Feature: ", i, "Correlation coefficient:", correlation, "p-value:", p_value)
            cnt += 1
            filtered_feat.append(i)
    exist_df.drop(filtered_feat, inplace=True, axis=1)
    print("Removed : ", cnt)
    
    #Point-biserial correlation - newly proposed features
    print("[1-2. Point-biserial correlation - newly proposed features]")
    cnt = 0
    filtered_feat = []
    for i in robust_df.columns[:-1]:
        correlation, p_value = pointbiserialr(robust_df.label, robust_df[i])
        if p_value > 0.1:
            print('\t',"Feature: ", i, "Correlation coefficient:", correlation, "p-value:", p_value)
            cnt += 1
            filtered_feat.append(i)
    robust_df.drop(filtered_feat, inplace=True, axis=1)
    print("Removed : ", cnt)
    
    #RFECV - existing feaatures
    print("[2-1. RFECV - existing features]")
    
    X = exist_df.drop(columns=["label"])
    y = exist_df.label
    X_train, X_valid, y_train, y_valid = train_test_split(X, y, shuffle=True, test_size=0.2, random_state=42) # train / vaild
    # Train a RandomForest model
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    min_features_to_select = 1
    step = 1
    print("Setting RFECV...")
    selector = RFECV(
        clf,
        step=step,
        cv=5,
        min_features_to_select=min_features_to_select,
        scoring="accuracy",
        n_jobs=-1,
    )

    print("Fitting Selector... It takes a couple of hours...")
    selector = selector.fit(X_train, y_train)

    rfecv_support = selector.support_

    rfecv_ranking = selector.ranking_
    print("Existing features RFECV support:", rfecv_support)
    print("Existing features RFECV ranking:", rfecv_ranking)

    mask = selector.get_support()
    existing_features = np.array(X_train.columns.to_list())
    best_features = existing_features[mask]

    print("All existing features: ", len(existing_features))
    print(existing_features)

    print("Selected best of existing features: ", best_features.shape[0])
    existing_features_RFECVOUT=best_features
    print(existing_features_RFECVOUT)
    
    existing_accuracy_score=selector.cv_results_["mean_test_score"]
    lineplot=sns.lineplot(existing_accuracy_score)
    fig=lineplot.get_figure()
    fig.savefig(os.path.join(OUTDIR, "Existing features RFECV accuracy.png"))
    
    #RFECV - newly proposed feaatures
    print("[2-2. RFECV - newly proposed features]")
    X = robust_df.drop(["label"], axis=1)
    y = robust_df.label
    X_train, X_valid, y_train, y_valid = train_test_split(X, y, shuffle=True, test_size=0.2, random_state=42) # train / vaild
    # Train a RandomForest model
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    min_features_to_select = 1
    step = 1
    print("Setting RFECV...")
    selector = RFECV(
        clf,
        step=step,
        cv=5,
        min_features_to_select=min_features_to_select,
        scoring="accuracy",
        n_jobs=-1,
    )

    print("Fitting Selector... It takes a couple of hours...")
    selector = selector.fit(X_train, y_train)

    rfecv_support = selector.support_
    rfecv_ranking = selector.ranking_
    print("New features RFECV support:", rfecv_support)
    print("New features RFECV ranking:", rfecv_ranking)

    mask = selector.get_support()
    new_features = np.array(X_train.columns.to_list())
    best_features = new_features[mask]

    print("All new features: ", len(new_features))
    print(new_features)

    print("Selected best of newly proposed features: ", best_features.shape[0])
    new_features_RFECVOUT=best_features
    print(new_features_RFECVOUT)
    
    new_accuracy_score=selector.cv_results_["mean_test_score"]
    lineplot=sns.lineplot(new_accuracy_score)
    fig=lineplot.get_figure()
    fig.savefig(os.path.join(OUTDIR, "Newly proposed features RFECV accuracy.png"))
    
    #3. Pearson & Spearman correlation
    print("[3. Pearson & Spearman correlation]")
    X_remain=train_df[existing_features_RFECVOUT+new_features_RFECVOUT]
    feature_list=X_remain.columns.tolist()
    print("Remaining features: ", feature_list)
    
    res_pearsonr = []
    for i in range(len(X_remain.columns)):
        for j in range(i, len(X_remain.columns)):
            if (
                pearsonr(
                    X_remain[X_remain.columns[i]], X_remain[X_remain.columns[j]]
                )[1]
                >= 0.05
            ):
                print(
                    f"{X_remain.columns[i]}, {X_remain.columns[j]} : {pearsonr(X_remain[X_remain.columns[i]], X_remain[X_remain.columns[j]])[1]}"
                )
                if (X_remain.columns[i] in features["feature_columns_wtagraph"]) & (X_remain.columns[j] in features['feature_columns_wtagraph']):
                    if (X_remain.columns[i].find("req_")!=-1 | X_remain.columns[i].find("fqdn_")!=-1):
                        res_pearsonr.append(X_remain.columns[j])
                    else:
                        res_pearsonr.append(X_remain.columns[i])
                elif (X_remain.columns[i] in features['feature_columns_wtagraph']):
                    res_pearsonr.append(X_remain.columns[i])
                else:
                    res_pearsonr.append(X_remain.columns[j])

    res_spearman = []

    for i in range(len(X_remain.columns)):
        for j in range(i, len(X_remain.columns)):
            if (
                spearmanr(
                    X_remain[X_remain.columns[i]], X_remain[X_remain.columns[j]]
                ).pvalue
                >= 0.05
            ):
                print(
                    f"{X_remain.columns[i]}, {X_remain.columns[j]} : {spearmanr(X_remain[X_remain.columns[i]], X_remain[X_remain.columns[j]]).pvalue}"
                )
                if (X_remain.columns[i] in features["feature_columns_wtagraph"]) & (X_remain.columns[j] in features['feature_columns_wtagraph']):
                    if (X_remain.columns[i].find("req_")!=-1 | X_remain.columns[i].find("fqdn_")!=-1):
                        res_spearman.append(X_remain.columns[j])
                    else:
                        res_spearman.append(X_remain.columns[i])
                elif (X_remain.columns[i] in features['feature_columns_wtagraph']):
                    res_spearman.append(X_remain.columns[i])
                else:
                    res_spearman.append(X_remain.columns[j])

    corr_list = pd.Series(res_pearsonr + res_spearman).unique()
    final_features=[i for i in feature_list if i not in corr_list]

    print(
        f"Final Selected Features : \n {final_features} "
    )
    
    #4. RFI & PI mean importance
    X_final=train_df[final_features]
    X_train, X_valid, y_train, y_valid = train_test_split(
        X_final, y, shuffle=True, test_size=0.2, random_state=42
    )  # train / vaild
    # Train a RandomForest model
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    print("Fitting RF classifier")
    clf.fit(X_train, y_train)

    # Get feature importances
    importances = clf.feature_importances_

    # Convert the importances into a DataFrame
    feature_importances = pd.DataFrame(
        {"feature": X_train.columns.to_list(), "importance": importances}
    )
    
    # Get permutation importances
    result = permutation_importance(
        clf, X_valid, y_valid, n_repeats=5, random_state=42, n_jobs=-1
    )
    # Convert the importances into a DataFrame
    perm_importances = pd.DataFrame(
        {"feature": X_train.columns.to_list(), "importance": result.importances_mean}
    )

    feature_importances.columns = ["feature", "RFI_importance"]
    perm_importances.columns = ["feature", "PI_importance"]
    concat = feature_importances.copy()
    concat = pd.concat([concat, perm_importances.PI_importance], axis=1)
    concat["RFI_PI_MEAN"] = (concat.RFI_importance + concat.PI_importance) / 2
    print("RFI, PI, Mean Importance")
    print(concat)
    return
        
def model_selection():
    print("model selection")
    h2o.init(nthreads = 12, max_mem_size = "64g", enable_assertions = False)
    h2o.no_progress()
    
    train=pd.read_csv(dataset_dict['trainset'],index_col=0)
    test=pd.read_csv(dataset_dict['testset'],index_col=0)
    train.reset_index(inplace=True, drop=True)
    test.reset_index(inplace=True, drop=True)

    y = 'label'
    x = list(train)
    x.remove(y)

    h2o_train = h2o.H2OFrame(train)
    h2o_test = h2o.H2OFrame(test)

    h2o_train[y] = h2o_train[y].asfactor()
    h2o_test[y] = h2o_test[y].asfactor()

    # Select runtime for exploration
    MAXRUNTIME=3600
    print("Training AdFlush...")
    aml = H2OAutoML(max_runtime_secs=MAXRUNTIME, max_models=None, exclude_algos=['XGBoost', 'StackedEnsemble'], nfolds=5)
    # Run below code instead if you want to convert to ONNX format.
    # aml = H2OAutoML(max_runtime_secs=MAXRUNTIME, max_models=None,include_algos=['GBM'], nfolds=5)

    aml.train(x = x, y = y, training_frame = h2o_train, leaderboard_frame = h2o_test)
    print(aml.leaderboard)
    custom_path=aml.leader.save_mojo(os.path.join(MODELDIR,'AdFlush_custom'))
    
    print("Training done. Path to model: ", custom_path)
    
    if aml.leader.algo=="gbm":
        print("Converting to ONNX model...")
        ## Only available with GBM model
        ## We found that there is a problem in converting h2o to onnx format in windows due to automatically caching to ~AppData\temp, thus recommend to run this code in Linux
        onnx_model = onnxmltools.convert.convert_h2o(custom_path, target_opset=9)
        onnxmltools.utils.save_model(onnx_model, os.path.join(MODELDIR, "AdFlush_custom.onnx"))
        print("Done")
    return

def metrics(true, pred, _is_mutated, _return):
    if _return:
        # Number of attacks
        total_attacks = len(true)
        
        # Number of successful attacks (misclassifications)
        successful_attacks = sum(true != pred)
        tn, fp, fn, tp = confusion_matrix(true, pred).ravel()

        # Calculate FNR
        fnr = fn / (tp + fn)

        # Calculate FPR
        fpr = fp / (fp + tn)
        return accuracy_score(true, pred), precision_score(true, pred), recall_score(true, pred), f1_score(true, pred), fnr, fpr
    
    else:        
        print(f"Accuracy : {accuracy_score(true, pred)} ")
        print(f"Precision : {precision_score(true, pred)} ")
        print(f"Recall : {recall_score(true, pred)} ")
        print(f"F1 : {f1_score(true, pred)} ")
        # Number of attacks
        total_attacks = len(true)
        
        # Number of successful attacks (misclassifications)
        successful_attacks = sum(true != pred)
        tn, fp, fn, tp = confusion_matrix(true, pred).ravel()

        # Calculate FNR
        fnr = fn / (tp + fn)
        print('False Negative Rate:', fnr)

        # Calculate FPR
        fpr = fp / (fp + tn)
        print('False Positive Rate:', fpr)
        
        print("AUROC: ",roc_auc_score(true, pred))
        fprlist, tprlist, thresholds=roc_curve(true, pred)
        cutoff=thresholds[np.argmax(tprlist-fprlist)]
        print("TPR ", tprlist[cutoff], "at FPR ", fprlist[cutoff])
        
        # ASR
        if _is_mutated:
            asr = successful_attacks / total_attacks
            print("Attack Success Rate: ",asr)

def performance_evaluation(dataset_name, model_name):
    dataset_path=dataset_dict[dataset_name]
    print("[[Performance evaluation process of AdFlush using dataset: ",dataset_name, ", model: ",model_name,"]]")

    #Prepare datasets
    ISMUTATED=False
    if dataset_name=='testset':
        data_df=pd.read_csv(dataset_path, index_col=0)
    elif dataset_name=='gan' or dataset_name=='custom-gan':
        data_df=pd.read_csv(dataset_path, index_col=0)
        ISMUTATED=True
    elif dataset_name=='gnirts' or dataset_name=='javascript-obfuscator' or dataset_name=='wobfuscator':
        js_features=['brackettodot', 'num_get_storage', 'num_set_storage',
            'num_get_cookie', 'num_requests_sent', 'ng_0_0_2', 'ng_0_15_15', 'ng_2_13_2',
            'ng_15_0_3', 'ng_15_0_15', 'ng_15_15_15', 'avg_ident',
            'avg_charperline']
        test_df=pd.read_csv(dataset_dict['testset'],index_col=0)
        mutate_df=pd.read_csv(dataset_path,index_col=0)
        mutate_df=mutate_df[js_features].copy()
        mutate_performed=mutate_df.index
        test_df=test_df.loc[mutate_performed].copy()
        test_df.loc[mutate_performed,js_features]=mutate_df.loc[mutate_performed,js_features]
        data_df=test_df.copy()
        ISMUTATED=True
    label=data_df['label'].astype(int)
    
    if model_name.endswith("onnx"):
        print('Loading Model')
        model = 'AdFlush.onnx'
        if model_name.startswith('custom'):
            model='AdFlush_custom.onnx'

        # Check that the IR is well formed
        try:
            print("Checking model integrity...")
            onnx.checker.check_model(onnx.load(os.path.join(MODELDIR,model)))
            # Create an ONNX runtime session
            ort_session = ort.InferenceSession(os.path.join(MODELDIR, model))
            input_data = data_df.drop('label', axis=1).values.astype('float32')
            input_name = ort_session.get_inputs()[0].name
            label_name = ort_session.get_outputs()[0].name

            # Run the inference session to get the prediction results
            print('Running Inference Session')
            start_time=time.time()
            pred = ort_session.run([label_name], {input_name: input_data})[0]
            print("Inference time elapsed: ", time.time()-start_time, "seconds for ", len(label), " samples.")
            metrics(label.astype(int),pred.astype(int),ISMUTATED,False)
            
        except Exception as e:
            print("Error in loading model: ",e)
    
    else:
        h2o.init(nthreads = 12, max_mem_size = "64g", enable_assertions = False, verbose=False)
        h2o.no_progress()
        if model_name.startswith('custom'):
            model_path=os.path.join(MODELDIR,"AdFlush_custom",os.listdir(os.path.join(MODELDIR, "AdFlush_custom"))[-1])
        else:
            model_path=os.path.join(MODELDIR,"AdFlush_mojo.zip")
        print("Loading model...")
        h2o_model = h2o.import_mojo(model_path)
        h2o_test=h2o.H2OFrame(data_df)

        start_time=time.time()
        pred = h2o_model.predict(h2o_test)
        pred = pred.as_data_frame().predict
        print("Inference time elapsed: ", time.time()-start_time, "seconds for ", len(label), " samples.")
        metrics(label, pred.tolist(), ISMUTATED, False)
    return

def trainGAN(model):
    with open('features.yaml') as f:
        features = yaml.full_load(f)
    
    feature_set=''
    if model=='adflush':
        feature_set=features['feature_columns_adflush']
    elif model=='adgraph':
        feature_set=features['feature_columns_adgraph']
    elif model=='webgraph':
        feature_set=features['feature_columns_webgraph']
        
    print("Loading features...")
    dataset=pd.read_csv(os.path.join(DATADIR, 'all_df_883_test.csv'),index_col=0)
    X=dataset[feature_set]
    y = dataset.label
    X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=True, test_size=0.2, random_state=42)
    
    X_train_df=pd.DataFrame(X_train,columns=feature_set)
    y_train_df=pd.DataFrame(y_train, columns=['label'])
    X_test_df=pd.DataFrame(X_test, columns=feature_set)
    y_train_df=y_train_df.astype(int)
    

    with open(os.path.join('json','content_type_dict.json'),'r') as cjson:
        content_dict=json.loads(cjson.read())
        X_train_df['content_policy_type']=X_train_df['content_policy_type'].apply(lambda x: content_dict[x])
        X_test_df['content_policy_type']=X_test_df['content_policy_type'].apply(lambda x: content_dict[x])

    print("Training GAN...")
    mut_train, mut_target = GANGenerator(gen_x_times=1.1, cat_cols=None,
            bot_filter_quantile=0.001, top_filter_quantile=0.999, is_post_process=True,
            adversarial_model_params={
                "metrics": "AUC", 
                "max_depth": 2, 
                "max_bin": 100, 
                "learning_rate": 0.02, 
                "random_state": 42, 
                "n_estimators": 100,
            }, pregeneration_frac=2, only_generated_data=False,
            gen_params = {
                "batch_size": 2000, 
                "patience": 25, 
                "epochs" : 50,
            }).generate_data_pipe(X_train_df, y_train_df,
                                            X_test_df, deep_copy=True, only_adversarial=False, use_adversarial=True)
            
    mut_train['label']=mut_target.values
    mut_train.to_csv(os.path.join(DATADIR, 'custom_GAN_mutated_'+model+'.csv'))
    return

def extractJS():
    ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram= extract_JS_Features(file_name="sample", _isHTML=False)
    print("\nNew features for processing/sample.js\n\t", "ast_depth: ",ast_depth, "ast_breadth: ",ast_breadth, "avg_ident: ",avg_ident," avg_charperline: ", avg_charperline, "brackettodot: ",brackettodot, "num_requests_sent: ",num_requests_sent, "num_set_storage: ",num_set_storage, "num_get_storage: ",num_get_storage, "num_get_cookie: ",num_get_cookie, "ngram: ",ngram)

    print("\n")
    
    ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram= extract_JS_Features(file_name="sample", _isHTML=True)
    print("\nNew features for processing/sample.html\n\t", "ast_depth: ",ast_depth, "ast_breadth: ",ast_breadth, "avg_ident: ",avg_ident," avg_charperline: ", avg_charperline, "brackettodot: ",brackettodot, "num_requests_sent: ",num_requests_sent, "num_set_storage: ",num_set_storage, "num_get_storage: ",num_get_storage, "num_get_cookie: ",num_get_cookie, "ngram: ",ngram)

if __name__=="__main__":    
    if not os.getcwd().endswith("source"):
        print("Please run this file from the 'source' directory")
    else:
        main(sys.argv[0], sys.argv[1:])
