module.exports = function browser_assembleFile(contentArray, mimeType){
  return new Blob(contentArray, {type: mimeType});
};
