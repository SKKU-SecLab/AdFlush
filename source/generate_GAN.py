def train_GAN():
    # generate data
    # new_train1, new_target1 = OriginalGenerator().generate_data_pipe(train_df, target_df, test_df, )
    # new_train2, new_target2 = GANGenerator().generate_data_pipe(train_df, target_df, test_df, )

    # example with all params defined
    new_train3, new_target3 = GANGenerator(gen_x_times=1.1, cat_cols=None,
            bot_filter_quantile=0.001, top_filter_quantile=0.999, is_post_process=True,
            adversarial_model_params={
                "metrics": "AUC", "max_depth": 2, "max_bin": 100, 
                "learning_rate": 0.02, "random_state": 42, "n_estimators": 100,
            }, pregeneration_frac=2, only_generated_data=False,
            gan_params = {"batch_size": 2000, "patience": 25, "epochs" : 50,}).generate_data_pipe(train_df, target_df,
                                            test_df, deep_copy=True, only_adversarial=False, use_adversarial=True)
            
            
def main():
    train=
    target=