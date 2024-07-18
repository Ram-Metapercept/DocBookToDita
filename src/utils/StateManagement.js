let inputFileName=""

function setInputFileName(fileName) {
    inputFileName = fileName;
  }
  
  function getInputFileName() {
    return inputFileName;
  }


module.exports ={setInputFileName, getInputFileName}