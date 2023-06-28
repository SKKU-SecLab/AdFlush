
from tabgan.sampler import GANGenerator
import argparse
import sys
import pandas as pd

def prepare_training(feature):
    feature_set=''
    webgraph_features=['num_nodes', 'num_edges', 'nodes_div_by_edges', 'edges_div_by_nodes',
       'in_degree', 'out_degree', 'in_out_degree', 'ancestors', 'descendants',
       'closeness_centrality', 'average_degree_connectivity', 'eccentricity',
       'is_parent_script', 'is_ancestor_script', 'ascendant_has_ad_keyword',
       'is_eval_or_function', 'descendant_of_eval_or_function',
       'ascendant_script_has_eval_or_function',
       'ascendant_script_has_fp_keyword', 'ascendant_script_length',
       'num_get_storage', 'num_set_storage', 'num_get_cookie',
       'num_set_cookie', 'num_script_predecessors', 'num_script_successors',
       'num_requests_sent', 'num_requests_received', 'num_redirects_sent',
       'num_redirects_rec', 'max_depth_redirect', 'indirect_in_degree',
       'indirect_out_degree', 'indirect_ancestors', 'indirect_descendants',
       'indirect_closeness_centrality', 'indirect_average_degree_connectivity',
       'indirect_eccentricity', 'indirect_mean_in_weights',
       'indirect_min_in_weights', 'indirect_max_in_weights',
       'indirect_mean_out_weights', 'indirect_min_out_weights',
       'indirect_max_out_weights', 'num_set_get_src', 'num_set_mod_src',
       'num_set_url_src', 'num_get_url_src', 'num_set_get_dst',
       'num_set_mod_dst', 'num_set_url_dst', 'num_get_url_dst',
       'indirect_all_in_degree', 'indirect_all_out_degree',
       'indirect_all_ancestors', 'indirect_all_descendants',
       'indirect_all_closeness_centrality',
       'indirect_all_average_degree_connectivity', 'indirect_all_eccentricity']
    adgraph_features=['content_policy_type', 'url_length', 'is_subdomain', 'is_valid_qs',
       'is_third_party', 'base_domain_in_query', 'semicolon_in_query',
       'screen_size_present', 'ad_size_present', 'ad_size_in_qs_present',
       'keyword_raw_present', 'keyword_char_present', 'num_nodes', 'num_edges',
       'nodes_div_by_edges', 'edges_div_by_nodes', 'in_degree', 'out_degree',
       'in_out_degree', 'average_degree_connectivity', 'is_parent_script',
       'is_ancestor_script', 'ascendant_has_ad_keyword', 'is_eval_or_function',
       'descendant_of_eval_or_function',
       'ascendant_script_has_eval_or_function',
       'ascendant_script_has_fp_keyword', 'ascendant_script_length']
    adflush_features=['content_policy_type', 'fqdn_0', 'fqdn_1', 'fqdn_12', 'fqdn_14', 
                    'fqdn_17', 'fqdn_23', 'fqdn_24', 'fqdn_25', 'fqdn_26', 
                    'fqdn_27', 'fqdn_4', 'fqdn_6', 'is_subdomain', 'is_third_party', 
                    'keyword_char_present', 'num_requests_sent', 'num_set_storage', 'req_url_121', 'req_url_135', 
                    'req_url_179', 'req_url_18', 'req_url_21', 'req_url_22', 'req_url_33', 
                    'req_url_38', 'req_url_91']

    if feature=='adflush':
        feature_set=adflush_features
    elif feature=='adgraph':
        feature_set=adgraph_features
    elif feature=='webgraph':
        feature_set=webgraph_features
    else:
        return
    
    train=pd.read_csv('dataset/trainset.csv',index_col=0)
    test=pd.read_csv('dataset/testset.csv',index_col=0)
    train_df=train[feature_set]
    target_df=pd.DataFrame(train['label'])
    test_df=test[feature_set]
    train_GAN(train_df, target_df, test_df,feature)


def train_GAN(train_df, target_df, test_df,feature):
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
            gan_params = {
                "batch_size": 2000, 
                "patience": 25, 
                "epochs" : 50,
            }).generate_data_pipe(train_df, target_df,
                                            test_df, deep_copy=True, only_adversarial=False, use_adversarial=True)
            
    mut_train['label']=mut_target.values
    mut_train.to_csv('dataset/GAN_custom_mutated_'+feature+'.csv')
    
def main(program, args):
    parser=argparse.ArgumentParser(description="Generate GAN dataset")
    parser.add_argument('--feature',type=str, default='adflush',choices=['adflush','adgraph','webgraph'], help='Select features used in papers to train GAN upon.')
    a=parser.parse_args(args)
    
    prepare_training(a.feature)    
    
if __name__=="__main__":
    main(sys.argv[0],sys.argv[1:])