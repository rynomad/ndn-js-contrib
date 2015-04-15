function browser_getFileChunks(file) {
  return new Promise(function getFileChunks_Promise(resolve,reject){

        var chunks = {}
          , i = 0;

        chunks[Symbol.iterator] = function getFileChunks_Iterator(){
          var segment = i;

          var done = (i * 8000 > file.size);
          i++;
          var next = (!done) ? new Promise(function getFileChunks_Iterator_Promise(resolve,reject){
                      var chunk;
                      if ((segment+1) * 8000 > stats.size)
                        chunk = new Buffer(stats.size % 8000);
                      else
                        chunk = new Buffer(8000);

                      var reader = new FileReader();

                      reader.onloadend = function(e){
                        resolve(new Buffer(new Uint8Array(e.target.result)), segment);
                      };

                      reader.readAsArrayBuffer(file.slice(segment * 8000, (segment + 1)*8000));
                    })
                    : null;


          return {
            value : next
            ,done : done
          };
        };

  });
}

module.exports = browser_getFileChunks;
