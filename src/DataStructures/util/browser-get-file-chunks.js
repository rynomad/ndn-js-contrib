function getFileChunks_Iterator(file){
  this.curr = 0
  this.file = file;
  return this;
};

getFileChunks_Iterator.prototype.next = function(){
  var file = this.file
  var done = (this.curr * 8000 > file.size);
  var segment = this.curr;
  this.curr++;
  var next = (!done) ? new Promise(function getFileChunks_Iterator_Promise(resolve,reject){
              var chunk;
              if ((segment+1) * 8000 > file.size)
                chunk = new Buffer(file.size % 8000);
              else
                chunk = new Buffer(8000);

              var reader = new FileReader();
              var chunkNumber = segment;
              reader.onloadend = function(e){
                resolve({
                  buffer: new Buffer(new Uint8Array(e.target.result))
                  , chunkNumber: segment
                });
              };

              reader.readAsArrayBuffer(file.slice(segment * 8000, (segment + 1)*8000));
            })
            : null;


  return {
    value : next
    ,done : done
  };
}


function browser_getFileChunks(file) {
  return new Promise(function getFileChunks_Promise(resolve,reject){
    var chunks = {};

    chunks[Symbol.iterator] = function(){
      return new getFileChunks_Iterator(file)
    }

    resolve(chunks);

  });
}

module.exports = browser_getFileChunks;
