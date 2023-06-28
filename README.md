# Welcome to AdFlush

Document for submitted paper "AdFlush: A Lightweight and Accurate Web Tracking and Advertisement Detector" at NDSS 2024. 
*AdFlush* is the first advertisement and web tracker blocker Chrome Extension based on Machine Learning prediction. With thorough feature engineering process considering state-of-the-art methodology, *AdFlush* takes advantage of its lightweight and powerful classification ability to detect and block advertisement and web trackers preserving user privacy in the same time. Please refer to our paper for details of the framework and evaluation results of *AdFlush*.
<hr>

## Within Python or Conda
### Requirements
This study has been run and tested in *Python==3.10.11* and *Conda==23.5.0*. 
#### Python
To run the source codes in python environment run the following code.
```bash
pip install -r requirements.txt
```
#### Conda
To run the source codes in conda environment run the following code.
```bash
conda create --name <env> --file requirements_conda.txt
```
#### Prepare Dataset
- Setup the directory structure as it is the same as this GitHub repository.
    - We recommend you to use <a href="https://github.com/fedebotu/clone-anonymous-github">Clone Anonymous Github</a> to clone this anonymous repository in ease. 
    - Move to the directory you want to import *AdFlush*. 
    ```bash
    cd path/to/working/directory
    ```
    - Within the directory, run the following source codes. 
    ```bash
    git clone https://github.com/fedebotu/clone-anonymous-github.git
    python3 clone-anonymous-github/src/download.py --url https://anonymous.4open.science/r/AdFlush-93D1 --save_dir AdFlush
    cd AdFlush
    ```
- Download the files(*testset.csv*, *trainset.csv*) from https://zenodo.org/record/8091819 and replace the *\*.placeholder* files respectively in */dataset* folder. 

### How to evaluate *AdFlush*
Run the following source code within *AdFlush*'s directory to evaluate *AdFlush* within python based environment. We provide accuracy, precision, recall, F1-score, attack success rate (for GAN mutated dataset), false positive rate, false negative rate metrics for the given datasets. 
```bash
python3 source/main.py --dataset test
```
Output Example

> Loading test dataset...
> Open ONNX session
> Running...
> Inference time elapsed:  0.24999642372131348 for  166032  samples.
>   Performace Metrics:
>       Accuracy:  0.9788354052230895
>       Precision:  0.9839751993460524
>       Recall:  0.9626544746729437
>       F1:  0.9731980779498131
>       False Negative Rate: 0.03734552532705627
>       False Positive Rate: 0.010415100391944586

Arguements
>
> `--dataset`: the dataset to use in evaluation. Available values are `train`, `test`, and `gan`.

<hr>

## Within Chrome Extension
### Requirements
