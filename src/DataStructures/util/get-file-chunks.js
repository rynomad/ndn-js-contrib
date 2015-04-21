var fs = require("fs");

function getFileChunks_Iterator(fd, stats){
  this.fd = fd;
  this.curr = 0;
  this.stats = stats;
  return this;
};

getFileChunks_Iterator.prototype.next = function getFileChunks_Iterator_next(){
  var stats = this.stats;
  var fd = this.fd
  var segment = this.curr;
  var done = (segment * 8000 > this.stats.size);
  this.curr++;


  var next = (!done) ? new Promise(function getFileChunks_Iterator_Promise(resolve,reject){
              var chunk;
              if ((segment+1) * 8000 > stats.size)
                chunk = new Buffer(stats.size % 8000);
              else
                chunk = new Buffer(8000);

              fs.read(fd, chunk, 0, chunk.length, segment * 8000, function(err, read, buffer){
                if (err)
                  return reject(err);

                resolve({
                  buffer: buffer
                  , chunkNumber: segment
                });
              });
            })
            : null;

  return {
    value : next
    ,done : done
  };
};

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

        chunks[Symbol.iterator] = function(){
          return new getFileChunks_Iterator(fd, stats);
        }

        resolve(chunks)

      });
    });
  });
}

module.exports = getFileChunks;
