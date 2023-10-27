# Welcome to *AdFlush*

Document for submitted paper *AdFlush: A Real-World Deployable Machine Learning Solution for Effective Advertisement and Web Tracker Prevention* at Web Conference 2024. 

*AdFlush* is the first advertisement and web tracker blocker Chrome Extension based on Machine Learning prediction. With thorough feature engineering process considering state-of-the-art methodology, *AdFlush* takes advantage of its lightweight and powerful classification ability to detect and block advertisement and web trackers preserving user privacy in the same time. Please refer to our paper for details of the framework and evaluation results of *AdFlush*.

# Abstract
Ad blocking and web tracking prevention tools are widely used, but traditional filter list-based methods struggle to cope with web content manipulation. Machine learning-based approaches have been proposed to address these limitations, but they have primarily focused on improving detection accuracy at the expense of practical considerations such as deployment overhead. In this paper, we present *AdFlush*, a lightweight machine learning model for ad blocking and web tracking prevention that is practically designed for the Chrome browser. To develop *AdFlush*, we first evaluated the effectiveness of 883 features, including 350 existing and 533 new features, and ultimately identified 27 key features that achieve optimal detection performance. We then evaluated *AdFlush* using a dataset of 10,000 real-world websites, achieving an F1 score of 0.98, which outperforms state-of-the-art models such as AdGraph (F1 score: 0.93), WebGraph (F1 score: 0.90), and WTAgraph (F1 score: 0.84). Importantly, *AdFlush* also exhibits a significantly reduced computational footprint, requiring 56% less CPU and 80% less memory than AdGraph. We also evaluated the robustness of *AdFlush* against adversarial manipulation, such as URL manipulation and JavaScript obfuscation. Our experimental results show that *AdFlush* exhibits superior robustness with F1 scores of 0.89–0.98, outperforming AdGraph and WebGraph, which achieved F1 scores of 0.81–0.87 against adversarial samples. To demonstrate the real-world applicability of *AdFlush*, we have implemented it as a Chrome browser extension and made it publicly available. We also conducted a six-month longitudinal study, which showed that *AdFlush* maintained a high F1 score above 0.97 without retraining, demonstrating its effectiveness. Additionally, *AdFlush* detected 642 URLs across 108 domains that were missed by commercial filter lists, which we reported to filter list providers.

The demo of exploring real-life web sites and detecting, blocking advertisements and trackers using *AdFlush* is available <a href="https://www.youtube.com/watch?v=dzdfqpiCjKg">here</a>.


[<img src="http://img.youtube.com/vi/dzdfqpiCjKg/0.jpg" width="600" height="400"
/>](https://youtu.be/dzdfqpiCjKg)

<hr>

# 1. Within Python Environment

## 1. Prerequisites
This study has been run and tested in *Python==3.10.11*, in both following environments:
- *javac=17.0.7*, *Windows 10 Pro 22H2*
- *openjdk==11.0.17*, *Linux 4.15.0-197-generic (bionic 18.04)*

H2O requires 64-bit JDK of versions over 7. You can download Java as the same version as tested from <a href="https://www.oracle.com/kr/java/technologies/javase/javase8u211-later-archive-downloads.html">here</a>. 

### 1.  Clone Repository
Setup the directory structure as it is the same as this GitHub repository.  
1. We recommend you to use <a href="https://github.com/fedebotu/clone-anonymous-github">Clone Anonymous Github</a> to clone this anonymous repository in ease.  

2. Move to the directory you want to import *AdFlush*.  
```bash
cd path/to/working/directory
```

3. Within the directory, run the following source codes.  
```bash
git clone https://github.com/fedebotu/clone-anonymous-github.git
python3 clone-anonymous-github/src/download.py --url https://anonymous.4open.science/r/AdFlush-4EF0 --save_dir AdFlush
cd AdFlush
``` 

### 2. Python Venv
To run the source codes in python environment run the following code. 
```bash
mkdir adflushvenv
cd adflushvenv
python3 -m venv adflush
source adflush/bin/activate
cd ../AdFlush-4EF0
pip3 install -r requirements.txt
```

### 3. Prepare Dataset
Download the following .csv files to `./dataset` folder from <a href="https://zenodo.org/records/10047813">here</a> to replace the `.placeholder` files. 
```bash
AdFlush_test.csv
AdFlush_train.csv
all_df_883_test.csv
all_df_883_train.csv
```
We publically open additional datasets not required in the following source codes but involved with or resulting from our study in `Dataset.tar.gz`. 

<hr>

## 2. Feature Enginnering Framework of AdFlush

Open `./source/AdFlush_feature_engineering.ipynb` and follow the steps to reproduce the results of *AdFlush*'s feature engineering framework. The contents are:
1. Point-Biserial Correlation
2. RFECV(Recursive Feature Elimination with Cross-Validation)
3. Pearson & Spearman
4. RFI-PI mean Importance

- Note: To run the Jupyter Notebook with *adflush* venv, select Python's interpreter as the path of `/path/to/working/directory/AdFlush/adflushvenv/bin/python`, then select the kernel as *adflush*. 
<hr>

## 3. Modeling AdFlush

Open `./source/AdFlush_model.ipynb` and follow the steps to reproduce the results of evaluating *AdFlush* upon various datasets. The contents are:
1. Testing *AdFlush* ONNX
2. Training and Testing *AdFlush* H2O Mojo
    1. Making a custom *AdFlush*
        1. Training custom *AdFlush*
        2. Convert *AdFlush* H2O Mojo to ONNX
    2. Testing *AdFlush* H2O Mojo
    3. Explainable AI with *AdFlush* H2O Mojo
    4. Longitudinal Experiment

- We must note that the results of the source code may differ from the results in our paper. The ONNX convertion involves compatibility within multiple environments, nessecary for browser extension implementation. However in this way the limit of Opsets in conversion acts as an upperbound in model performance by degrading precise floating point computation. 

<hr>

## 4. Generate GAN mutated datasets
Run the following source code within *AdFlush*'s directory to train a new GAN as the robustness evaluation of *AdFlush* and create a custom mutated dataset. You can vary the parameters and also use the dataset to evaluate performance of *AdFlush*. We provide `generate_GAN.py` to train GAN upon desired hyperparameters. 

Modify the hyperparameters in `./source/generate_GAN.py` and run the code below to train GAN and build a mutated dataset. 

```bash
python3 source/generate_GAN.py --feature adflush
```

Arguements

> - `--feature` : the feature set to fit and train GAN upon. Available values are `adflush`, `adgraph`, and `webgraph`. 

The output of the code above will generate a mutated dataset from the newly trained GAN as `GAN_custom_mutated_<featureset>.csv`. You can utilize this dataset to evaluate the robustness of *AdFlush*.

<hr>

## 5. Encodings used in *AdFlush*
The details of encodings used in *AdFlush* are implemented in `./source/encodings.py`.
- `trainCharEmbeddings`: Train a custom character embedding dictionary using <a href=https://radimrehurek.com/gensim/models/word2vec.html>Word2Vec</a>. 
- `char2vec_pretrained`: Apply Word2Vec with *AdFlush*'s pretrained character embedding dictionaries.
- `extract_JS_Features`: Extract JavaScript features as implemented in *AdFlush*. This contains *n-grams* of JavaScript's Abstract Syntax Tree. 
    - input: file name of HTML or JavaScript source code. Place the file within `./source/processing/` directory for proper use.

<hr>

# 2. Within Chrome Extension
The following browser extension is developed in `npm==9.5.1`. 

### Setting Up *AdFlush*

1. Open a Chrome web browser.  

2. Click on the options and navigate to `Extensions` > `Manage Extensions`.  
    ![Prerequisites 1](./assets/browser_extension_pre1.png)

3. Click on `Manage Extensions` Within the page, click on `Load unpacked`. If you don't see this button, make sure you have enabled `Developer mode` on the right side of the page.  
    ![Prerequisites 2](./assets/browser_extension_pre2.png)

4. Navigate to `path/to/working/directory/AdFlush/extension/dist` and select the folder.  
    ![Prerequisites 3](./assets/browser_extension_pre3.png)

5. Open your extensions and pin *AdFlush* to utilize full functionalities.  
    ![Prerequisites 4](./assets/browser_extension_pre4.png)

<hr>

### Applying Modification to *AdFlush*
If you decide to apply some modifications within our chrome extension or want to customize behavior, you must use <a href="https://webpack.js.org/">webpack</a> to repack the extension reflecting your modifications.

1. Open a command line prompt and navigate to `path/to/working/directory/AdFlush/extension`. Run the source code below to install the packages required for *AdFlush* chrome extension.
```bash
npm install
```

2. When you are done applying modifications to *AdFlush*, un the source code below to pack the source codes with appropriate npm packages. 
```bash
npx webpack --config=webpack.config.js
```

3. Press the refresh button to reload *AdFlush* within your chrome extension and you are ready to run the modified *AdFlush*.  
    ![Modification](./assets/Modification.PNG)

<hr>

# 3. Dataset

We opensource our *AdFlush* dataset used within our study. Our dataset consists of top 10K web pages from Tranco list, crawled at the date April 4, 2023. We divided our dataset for training processes and evaluation by 8:2 ratio. We also provide the datasets obtained with our trained GAN or several JavaScript obfuscation and used in robustness evaluation. These are available in `./dataset` directory. 
- `AdFlush_train.csv`: Train set of *AdFlush*
- `AdFlush_test.csv`: Test set of *AdFlush*
- `all_df_883_`: Dataset collected by extracting all possible 883 features
- `GAN_mutated_` : GAN mutated test sets for each method
- `JS_obfuscated_`: JavaScript features obtained by each obfuscation method for *AdFlush*

Further more, we publically open the datasets used to inference the existing methods used to compare with *AdFlush* within our <a href="https://zenodo.org/records/10047813">Zenedo</a> within `Dataset.tar.gz`. 

(Optional) We collected our dataset from OpenWPM. To run all tasks (Graph building, Feature extraction or Classification) on WebGraph and AdGraph, the crawl data used is collected using a custom version of [OpenWPM](https://github.com/sandrasiby/OpenWPM/tree/webgraph). Follow the instructions [here](https://github.com/sandrasiby/OpenWPM/tree/webgraph#readme) to setup OpenWPM in your environment.