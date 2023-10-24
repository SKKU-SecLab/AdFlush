const {parse}=require('meriyah')
const fs=require('fs')

function parseAST(js){
    let comment=[];
    ast=parse(js
        , {
        onComment: comment,
        // raw:true,
        // globalReturn: true,
        // lexical:true,
        // identifierPattern:true
    });
    let result={'ast':ast, 'comment':comment}
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