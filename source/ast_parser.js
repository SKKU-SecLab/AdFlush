const {parse}=require('acorn-loose')
const fs=require('fs')

function parseAST(js){
    ast=parse(js,{ecmaVersion: 2022} );
    let result={'ast':ast}
    fs.writeFile(process.argv[3], JSON.stringify(result), (err)=>{
        if(err){
            console.log(err);
            return;
        }
        else{
            console.log('OKAY');
            return;
        }
    });
}

fs.readFile(process.argv[2], 'utf-8', (err, data)=>{
    if(err){
        console.log(err);
        return;
    }
    parseAST(data);
});