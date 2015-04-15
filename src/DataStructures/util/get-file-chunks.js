var fs = require("fs");

function getFileChunks(filePath) {
  return new Promise(function getFileChunks_Promise(resolve,reject){
    fs.open(filePath, "r", function(err, fd){
      if (err)
        return reject(err);

      fs.fstat(fd, function(err, stats){
        if (err)
          return reject(err);

        var chunks = {}
          , i = 0;

        chunks[Symbol.iterator] = function getFileChunks_Iterator(){
          var segment = i;
          var done = (i * 8000 > stats.size);
          i++;


          var next = (!done) ? new Promise(function getFileChunks_Iterator_Promise(resolve,reject){
                      var chunk;
                      if ((segment+1) * 8000 > stats.size)
                        chunk = new Buffer(stats.size % 8000);
                      else
                        chunk = new Buffer(8000);

                      fs.read(fd, chunk, 0, chunk.length, segment * 8000, function(err, read, buffer){
                        if (err)
                          return reject(err);

                        resolve(buffer, segment);
                      });
                    })
                    : null;

          return {
            value : next
            ,done : done
          };
        };

      });
    });
  });
}

module.exports = getFileChunks;
