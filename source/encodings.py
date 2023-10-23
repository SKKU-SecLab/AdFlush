import numpy as np
from tqdm import tqdm
from gensim.models import Word2Vec
import pandas as pd
import json

def char2vec(charlist, char_vec, vocabs):
    UrlVec = np.average([char_vec[vocabs[c]] for c in charlist], axis=0) 
    return UrlVec

def trainCharEmbeddings(url_df, test_df, _isrequestURL):
    # Input: { 
    #     url_df: URL column (1xn, dataframe) of train dataset, 
    #     test_df: URL column (1xm, dataframe) of test dataset, 
    #     _isrequestURL: if True=request URL embedding, if False=FQDN(source) embedding
    # }
    # Output: {
    #     features: character embedding of train dataset, 
    #     features_test: character embedding of test dataset 
    # } 
    features = []
    features_test = []
    vector_size=30
    if _isrequestURL:
        vector_size=200
    
    print('model load')
    model = Word2Vec(url_df, vector_size=vector_size, window=3, min_count=1, workers=30, hs=1, sg=1)

    b_word_vectors = model.wv
    b_vocabs = b_word_vectors.key_to_index
    b_char_vectors = [b_word_vectors[v] for v in b_vocabs]

    for j in tqdm(range(len(url_df))):
        features.append(list(char2vec(url_df[j], b_char_vectors, b_vocabs)))
        
    for j in tqdm(range(len(test_df))):
        features_test.append(list(char2vec(test_df[j], b_char_vectors, b_vocabs)))
    return pd.DataFrame(features), pd.DataFrame(features_test)

def char2vec_pretrained(url, _isrequestURL):
    # Input: {
    #     url: URL to perform character embedding
    #     _isrequestURL: if True=request URL embedding, if False=FQDN(source) embedding
    # }
    # Output: {
    #     vec: vector of character embedding
    # }
    char2vecDict={}
    if _isrequestURL:
        with open('reqwordvec.json','r') as vdict:
            char2vecDict=json.loads(vdict.read())
            
    else:    
        with open('fqdnwordvec.json','r') as vdict:
            char2vecDict=json.loads(vdict.read())
    vec=np.array([char2vecDict[c] for c in url]).mean(axis=0)
    return vec

def content_policy_type_encoding(content_policy_type):
    # Input: { content_policy_type: value to target encode with pretrained dictionary }
    with open('content_type_dict','r') as vdict:
        content_dict=json.loads(vdict.read())
        return content_dict[content_policy_type]
    
def ngram_encodings(source_code, _isHTML):
    ## TODO
    return ""