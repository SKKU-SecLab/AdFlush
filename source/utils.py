import json
import numpy as np

def character_embedding(requestURL:str, sourceURL:str):
    with open('source/fqdnwordvec2.json', 'r') as f:
        fqdndict=json.load(f)
    with open('source/reqwordvec2.json','r') as f:
        reqdict=json.load(f)

    reqvector=np.zeros(200)
    fqdnvector=np.zeros(30)

    for c in requestURL:
        reqvector+=reqdict[c]
    reqvector/=len(requestURL)

    for c in sourceURL:
        fqdnvector+=fqdndict[c]
    fqdnvector/=len(sourceURL)
    
    return reqvector, fqdnvector