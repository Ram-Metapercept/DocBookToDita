



const RemoveUnwantedElement=(xmlData)=>{
    let json=typeof xmlData
// console.log(xmlData)
    if(json==='object' && json !==null) {
     for(let i in xmlData){


    if(typeof xmlData[i] === 'object' && xmlData[i]!==null) {
        RemoveUnwantedElement(xmlData[i]);
    }  else if(Array.isArray(xmlData[i])){
        for(let j of xmlData[i]){
            if(typeof j === 'object' && j!==null) {
                RemoveUnwantedElement(j);
            }
        }
    } else if(typeof xmlData[i] ==='string'){
        xmlData[i]=xmlData[i].replace(/<[^>]*>?/gm, '');
        xmlData[i]=xmlData[i].replace(/&amp;/g, '&');
        xmlData[i]=xmlData[i].replace(/&lt;/g, '<');
        xmlData[i]=xmlData[i].replace(/&gt;/g, '>');
        // xmlData[i]=xml
}

    }
}
}
module.exports=RemoveUnwantedElement