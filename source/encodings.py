import numpy as np
from tqdm import tqdm
from gensim.models import Word2Vec
import pandas as pd
import json
import subprocess
import re
import logging
from bs4 import BeautifulSoup as bs

PATHTOPROCESSING="processing"
NGRAM=3
logging.basicConfig(filename='error.log',filemode='a', level=logging.WARNING)
logging.error("START LOG")

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
        with open('json/reqwordvec.json','r') as vdict:
            char2vecDict=json.loads(vdict.read())
            
    else:    
        with open('json/fqdnwordvec.json','r') as vdict:
            char2vecDict=json.loads(vdict.read())
    vec=np.array([char2vecDict[c] for c in url]).mean(axis=0)
    return vec

def content_policy_type_encoding(content_policy_type):
    # Input: { content_policy_type: value to target encode with pretrained dictionary }
    with open('json/content_type_dict.json','r') as vdict:
        content_dict=json.loads(vdict.read())
        return content_dict[content_policy_type]
    
    
def makeAST(fname):
    # read {fname}.js from processing directory, parse AST to .txt in processing directory
    try:
        result=subprocess.check_output('node ast_parser.js'+' '+'./'+PATHTOPROCESSING+'/'+fname+'.js'+' '+'./'+PATHTOPROCESSING+'/'+fname+'.txt', shell=True)        
        result=result.decode('UTF8').split()[0]
        if result=='OKAY':
            return 1
        else:
            return 0
    except subprocess.CalledProcessError:
        return -1

def treewalk(node):
    ret=[]
    if isinstance(node, list):
        for child in node:
            ret+=treewalk(child)
    elif isinstance(node, dict):
        for key, child in node.items():
            if isinstance(child, (dict, list)):
                ret+=treewalk(child)
        if 'type' in node:
            ret.append(node['type'])
    return ret


def treewalk_featext(node):
    depth=1
    breadth=0
    idlen=0
    idcount=0
    if isinstance(node,dict):
        found=0
        for k,c in node.items():
            if isinstance(c, (dict,list)):
                found=1
                td,tb, idl, idc=treewalk_featext(c)
                td=td+1
                breadth+=tb
                if td>depth:
                    depth=td
                idlen+=idl
                idcount+=idc
        if found==0:
            keys=node.keys()
            if 'type' in keys and 'name' in keys:
                if node['type']=='Identifier':
                    idlen=len(node['name'])
                    idcount=1
            return 1,1, idlen, idcount
        return depth, breadth, idlen, idcount
        
    if isinstance(node, list):
        for c in node:
            td,tb, idl, idc=treewalk_featext(c)
            td=td+1
            breadth+=tb
            if td>depth:
                depth=td
            idlen+=idl
            idcount+=idc
        return depth, breadth, idlen, idcount
    else:
        return depth, breadth, idlen, idcount


def extract_JS_Features(file_name, _isHTML):
    # Input: source_code= File name(without extension) of javascript or HTML source code to extract JavaScript features
    # Example of source code is the content of /processing/sample.js
    # Output: Extracted JavaScript features as below
    ast_depth=0
    ast_breadth=0
    avg_ident=0
    avg_charperline=0
    brackettodot=0
    num_requests_sent=0
    num_set_storage=0
    num_get_storage=0
    num_get_cookie=0
    ngram={}
    
    REQSENT=r"https?:\/\/"
    SETSTOR=r"(Storage\.setItem)|(Storage\[[^]]+\] *=)|(Storage\.[^=;\n]+(?!;\n)=)|(Storage *=)"
    GETSTOR=r"(Storage\.get)|(Storage\[[^]]+\](?!=)*(?=\n|;))|(Storage\.[\w]+(?!=)(?=;|\n))|(Storage(?!=)(?=;|\s))"
    GETCOOK=r"(cookies?\.get)|(cookies?\[[^]]+\](?!=)*(?=\n|;))|(cookies?\.[\w]+(?!=)(?=;|\n))|(cookies?(?!=)(?=;|\s))"
    
    if not _isHTML:
        with open(PATHTOPROCESSING+'/'+file_name+'.js','r',encoding='UTF8') as readf:
            source_code=readf.read()
            try:
                astresult=makeAST(file_name)
                if astresult==1:
                    with open(PATHTOPROCESSING+'/'+file_name+'.txt','r', encoding="UTF8") as astf:
                        parseresult=json.loads(astf.read())
                        ast=parseresult['ast']
                        gram_source=treewalk(ast)
                        with open('json/ngram_token_dict.json','r') as asttoken:
                            ast_token_dict=json.loads(asttoken.read())
                            idx_gram_src=[ast_token_dict[t] for t in gram_source]
                            ngram_len=len(idx_gram_src)-NGRAM+1
                            if ngram_len>0:
                                for i in range(len(idx_gram_src)-NGRAM+1):
                                    pattern_name='ng_'+str(idx_gram_src[i])+"_"+str(idx_gram_src[i+1])+"_"+str(idx_gram_src[i+2])
                                    if pattern_name in ngram:
                                        ngram[pattern_name]+=1
                                    else:
                                        ngram[pattern_name]=1
                                        
                                ngram={p_name:ngram[p_name]/ngram_len for p_name in ngram}
                            else:
                                logging.error("NGRAM TOO SHORT: "+str(file_name))
                                
                            ast_depth, ast_breadth, ident_len, ident_count=treewalk_featext(ast)
                            avg_ident=ident_len/ident_count if ident_count>0 else 0
                            if avg_ident!=0:
                                avg_ident=1/avg_ident       ## Use multiplicative inverse to make value linear with 0 (unexisting values)
                            
                            avg_charperline=sum(len(line) for line in source_code.split('\n')) / (len(source_code.split('\n')) or 1)
                            
                            js_clean=re.sub(
                                r"\"[^\"]*\.?[^\"]*\"|'[^']*\.?[^']*'|\d+\.\d+|\/\/[^\n]*|\/\*.*?\*\/",
                                "", 
                                source_code, 
                                flags=re.DOTALL
                            )
                            dot_count = js_clean.count('.')
                            all_brackets_count = js_clean.count('[') + js_clean.count(']') + js_clean.count('(') + js_clean.count(')')
                            brackettodot = all_brackets_count / dot_count if dot_count else 0
                            
                            reqreg=re.findall(REQSENT, js_clean)
                            num_requests_sent=len(reqreg) if reqreg else 0
                            
                            setstorreg=re.findall(SETSTOR, js_clean)
                            num_set_storage=len(setstorreg) if setstorreg else 0
                            
                            getstorreg=re.findall(GETSTOR, js_clean)
                            num_get_storage=len(getstorreg) if getstorreg else 0
                            
                            getcookreg=re.findall(GETCOOK, js_clean)
                            num_get_cookie=len(getcookreg) if getcookreg else 0
                            
                            return ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram
                else:
                    logging.error("SUBPROC RESULTED IN NON 1: "+str(file_name))
                    return ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram
            except Exception as err:
                logging.error("AST PARSE ERROR: "+str(file_name)+' '+str(err))
                return ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram

        
    else:
        with open(PATHTOPROCESSING+'/'+file_name+'.html','r',encoding='UTF8') as readf:
            html_source_code=readf.read()
            try:
                soup=bs(html_source_code,'html.parser')
                inline_js=[tag.text for tag in soup.find_all('script') if tag.text!='']
                count=0
                total_ngram_len=0
                
                for source_code in inline_js:
                    jsfile_name=file_name+'_'+str(count)
                    with open(PATHTOPROCESSING+'/'+jsfile_name+'.js','w',encoding='UTF8') as writejs:
                        writejs.write(source_code)
                    this_ast_depth=0
                    this_ast_breadth=0
                    this_avg_ident=0
                    this_avg_charperline=0
                    this_brackettodot=0
                    this_num_requests_sent=0
                    this_num_set_storage=0
                    this_num_get_storage=0
                    this_num_get_cookie=0
                    
                    try:
                        astresult=makeAST(jsfile_name)
                        if astresult==1:
                            with open(PATHTOPROCESSING+'/'+jsfile_name+'.txt','r', encoding="UTF8") as astf:
                                parseresult=json.loads(astf.read())
                                ast=parseresult['ast']
                                gram_source=treewalk(ast)
                                with open('json/ngram_token_dict.json','r') as asttoken:
                                    ast_token_dict=json.loads(asttoken.read())
                                    idx_gram_src=[ast_token_dict[t] for t in gram_source]
                                    ngram_len=len(idx_gram_src)-NGRAM+1
                                    if ngram_len>0:                                    
                                        total_ngram_len+=ngram_len
                                        for i in range(len(idx_gram_src)-NGRAM+1):
                                            pattern_name='ng_'+str(idx_gram_src[i])+"_"+str(idx_gram_src[i+1])+"_"+str(idx_gram_src[i+2])
                                            if pattern_name in ngram:
                                                ngram[pattern_name]+=1
                                            else:
                                                ngram[pattern_name]=1
                                                
                                    else:
                                        logging.error("NGRAM TOO SHORT: "+str(jsfile_name))
                                        
                                    this_ast_depth, this_ast_breadth, this_ident_len, this_ident_count=treewalk_featext(ast)
                                    this_avg_ident=this_ident_len/this_ident_count if this_ident_count>0 else 0
                                    if this_avg_ident!=0:
                                        this_avg_ident=1/this_avg_ident       ## Use multiplicative inverse to make value linear with 0 (unexisting values)
                                    
                                    this_avg_charperline=sum(len(line) for line in source_code.split('\n')) / (len(source_code.split('\n')) or 1)
                                    
                                    js_clean=re.sub(
                                        r"\"[^\"]*\.?[^\"]*\"|'[^']*\.?[^']*'|\d+\.\d+|\/\/[^\n]*|\/\*.*?\*\/",
                                        "", 
                                        source_code, 
                                        flags=re.DOTALL
                                    )
                                    dot_count = js_clean.count('.')
                                    all_brackets_count = js_clean.count('[') + js_clean.count(']') + js_clean.count('(') + js_clean.count(')')
                                    this_brackettodot = all_brackets_count / dot_count if dot_count else 0
                                    
                                    reqreg=re.findall(REQSENT, js_clean)
                                    this_num_requests_sent=len(reqreg) if reqreg else 0
                                    
                                    setstorreg=re.findall(SETSTOR, js_clean)
                                    this_num_set_storage=len(setstorreg) if setstorreg else 0
                                    
                                    getstorreg=re.findall(GETSTOR, js_clean)
                                    this_num_get_storage=len(getstorreg) if getstorreg else 0
                                    
                                    getcookreg=re.findall(GETCOOK, js_clean)
                                    this_num_get_cookie=len(getcookreg) if getcookreg else 0
                                    
                                    if this_ast_depth>ast_depth:
                                        ast_depth=this_ast_depth
                                    if this_ast_breadth>ast_breadth:
                                        ast_breadth=this_ast_breadth
                                    if this_avg_ident>avg_ident:
                                        avg_ident=this_avg_ident
                                    if this_avg_charperline>avg_charperline:
                                        avg_charperline=this_avg_charperline
                                    if this_brackettodot>brackettodot:
                                        brackettodot=this_brackettodot
                                    if this_num_requests_sent>num_requests_sent:
                                        num_requests_sent=this_num_requests_sent
                                    if this_num_set_storage>num_set_storage:
                                        num_set_storage=this_num_set_storage
                                    if this_num_get_storage>num_get_storage:
                                        num_get_storage=this_num_get_storage
                                    if this_num_get_cookie>num_get_cookie:
                                        num_get_cookie=this_num_get_cookie
                                    
                        else:
                            logging.error("SUBPROC RESULTED IN NON 1: "+str(jsfile_name))
                            continue
                    except Exception as err:
                        logging.error("AST PARSE ERROR: "+str(jsfile_name)+' '+str(err))
                        continue
                    finally:
                        count+=1
                        
                
                ngram={p_name:ngram[p_name]/total_ngram_len for p_name in ngram}
                return ast_depth, ast_breadth, avg_ident, avg_charperline, brackettodot, num_requests_sent, num_set_storage, num_get_storage, num_get_cookie, ngram

            except Exception as err:
                logging.error("BS PARSE ERROR: "+file_name+" "+str(err))