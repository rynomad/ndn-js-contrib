var Repository = require("./Repository.js")
  , ContentStore = require("./ContentStore.js")
  , PIT = require("./PIT.js")
  , FIB = require("./FIB.js")
  , Strategy = require("./Strategy.js")
  , getFileChunks = require("./util/get-file-chunks.js")
  , assembleFile = require("./util/assemble-file.js")
  , Name = require("ndn-js/js/name.js").Name
  , Data = require("ndn-js/js/data.js").Data
  , Interest = require("ndn-js/js/interest").Interest
  , Tlv = require('ndn-js/js/encoding/tlv/tlv.js').Tlv
  , TlvDecoder = require('ndn-js/js/encoding/tlv/tlv-decoder.js').TlvDecoder;

function Node (){
  this._contentStore = new ContentStore();
  this._pit = new PIT();
  this._fib = new FIB();
  this._strategy = new Strategy();
}

Node.create = function Node_create(path){
  var node = new Node();
  if (path)
    return Repository.Open(path)
                      .then(function Node_create_Repository_Open(repo){
                        node._repository = repo;
                        return node;
                      });
  else
    return new Promise(function Node_create_no_repository(resolve,reject){
      resolve(new Node());
    });
}

function chunkIterator(chunks){
  this.curr = 0;
  this.size = chunks.length + 0;
  this.chunks = chunks;
  return this;
}

chunkIterator.prototype.next = function chunkIterator_next(){
  var self = this;
  var chunkNumber = this.curr;
  var done = (self.size === chunkNumber);
  this.curr++;

  var next = (!done) ? new Promise(function (resolve, reject){
                        resolve({
                          buffer: self.chunks.shift()
                          , chunkNumber : chunkNumber
                        });
                       })
                     : null;

  return {
    value: next
    ,done: done
  };
};

Node.getStringChunks = function Node_getStringChunks(string){
  return new Promise(function getStringChunks_Promise(resolve,reject){
    var chunks = [];

    chunks[Symbol.iterator] = function(){
      return new chunkIterator(chunks);
    };
    while (string.length > 0){
      chunks.push(string.substr(0,8000));
      string = string.substr(8000, string.length);
    }

    resolve(chunks);
  })
}

Node.getBufferChunks = function getBufferChunks(buffer){
  return new Promise(function getBufferChunks_Promise(resolve,reject){
    var chunks = [];
    var i = 0;

    chunks.numberOfChunks = Math.ceil((buffer.length / 8000));

    chunks[Symbol.iterator] = function(){
      return new chunkIterator(chunks);
    };

    while (i*8000 < buffer.length){
      chunks.push(buffer.slice(i*8000, (i+1)*8000));
      i++;
    }

    resolve(chunks);
  })
};

Node.getFileChunks = getFileChunks;

Node.assemble = function Node_assemble(datas){
  var meta = JSON.parse(datas.shift().content.toString());

  if (meta.type === "string" || meta.type === "json"){
    var str = "";
    while(datas.length)
      str += datas.shift().content.toString();
    if (meta.type === "json")
      str = JSON.parse(str);
    return str;
  } else if (meta.type === "buffer"){
    return Buffer.concat(datas.map(function(data){return data.content}));
  } else if (meta.type === "file"){
    return assembleFile(datas.map(function(data){return data.content}), meta.mime);
  }

}

Node.prototype.onData = function Node_onData(data, face){
  var self = this;
  self._pit
      .lookup(data, face)
      .then(function Node_onData_pitResults(faceArray){
        for (var i in faceArray)
          faceArray[i].putData(data);

        return self._contentStore.insert(data);
      })
      .then(function Node_onContentStoreDataEvicted(data){
        return data;
      })
      .catch(function(err){
        return data;
      })

}

Node.prototype.expressInterest = function Node_expressInterest(interest){
  var self = this;
  var t = Date.now();


  return self.fulfillInterest(interest)
            .then(function Node_onInterest_fulfill_Hit(data){
              return Promise.resolve({
                data: data
                , face: "local"
                , rtt: Date.now() -t
              });
            })
            .catch(function Node_onInterest_fulfill_Miss(){
              return self.forwardInterest(interest);
            });
}

Node.prototype.fulfillInterest = function Node_fulfillInterest(interest){
  var self = this;
  return this._contentStore
             .lookup(interest)
             .then(function (data){
               return data;
             })
             .catch(function(){
               return self._repository.lookup(interest);
             }).then(function(data){
               return data;
             }).catch(function(er){
               return Promise.reject()
             });
}

Node.prototype.forwardInterest = function Node_forwardInterest(interest, face){
  var self = this;
  return Promise.all([
    self._fib.lookup(interest)
    , self._strategy.lookup(interest)
  ])
  .then(function forwardInterest_on_FIB_Hit(results){
    var strategy = results[1]
      , nextHops = results[0]
      , choices = strategy.choose(nextHops);

    for (var i in choices)
      choices[i].face.putData(interest)

    return self._pit
                .insert(interest, face)
                .then(function(res){
                  strategy.log(choices, res);
                  return res;
                })
                .catch(function(res){
                  strategy.log(choices, null);
                  return Promise.reject("interest timeout");
                });

  });
};


Node.prototype.onInterest = function Node_onInterest(interest, face){
  var self = this;

  return self.fulfillInterest(interest)
             .then(function Node_onInterest_fulfill_Hit(data){
               face.putData(data);
               return true;
             })
             .catch(function Node_onInterest_fulfill_Miss(){
               return self.forwardInterest(interest, face);
             })
             .then(function Node_onInterest_forward_Response(res){
               return interest;
             })
             .catch(function Node_onInterest_forward_Timeout(message){
               return interest;
             });
}





Node.prototype.putData = function Node_putData(data, store){
  var self = this;
  store = store || this._contentStore;
  return Promise.all([
    store.insert(data)
    , self._pit
          .lookup(data)
          .then(function Node_putPacket_PIT_Hit(faces){
            for (var i in faces)
              faces[i].putData(data);
            return true;
          })
          .catch(function Node_putPacket_PIT_Miss(er){
            return false;
          })
    ]);
};

Node.prototype.put = function Node_put(param, store){
  var self = this
    , store = store || this._contentStore
    , type = param.type
    , data = param.data
    , versioned = param.versioned
    , prefix    = new Name(param.prefix)
    , freshnessPeriod = param.freshnessPeriod;

  return new Promise(function Node_put_Promise(resolve,reject){
    if (!(type && data && param.prefix))
      return reject(new Error("Node.put(param): param must include type, data, and prefix fields"))

    if (versioned)
      prefix.appendVersion(Date.now())

    var chunkify;
    if (type === "json"){
      chunkify = Node.getStringChunks(JSON.stringify(data));
    } else if (type === "string") {
      chunkify = Node.getStringChunks(data);
    } else if (type === "file"){
      chunkify = Node.getFileChunks(data);
    } else if (type === "buffer"){
      chunkify = Node.getBufferChunks(data);
    } else {
      return reject(new Error("Node.put(param): param.type must be json, string, file, or buffer"))
    }

    chunkify.then(function Node_put_processChunks(chunks){
      var name = new Name(prefix);
      name.appendSegment(0);
      delete param.data;
      var data0 = new Data(name, JSON.stringify(param));
      data0.getMetaInfo().setFreshnessPeriod(freshnessPeriod);
      data0.getMetaInfo().setFinalBlockID(
                            new Name.Component(Name.Component.fromNumberWithMarker(chunks.length, 0x00))
                          )

      var proms = [
        self.putData(data0, store)
      ];

      for (var chunk of chunks){
        proms.push(chunk.then(function onChunk(chunk){
          var name = new Name(prefix);
          name.appendSegment(chunk.chunkNumber+1);
          var data = new Data(name, chunk.buffer);
          return self.putData(data, store);
        }));
      }

      Promise.all(proms)
             .then(function Node_put_Promise_Resolve(puts){
               resolve(puts);
             })
             .catch(function Node_put_Promise_Reject(err){
               reject(err);
             })

    });
  });
};


Node.prototype.getMaximumPacketSendTime = function Node_getMaximumPacketSendTime(){
  return undefined;
}

Node.prototype.pipelineFetch = function Node_pipelineFetch(params){
  var name = params.prefix.append("prototype")
  var pipe = [];
  var numberOfPackets = params.finalBlock + 1;
  var millisecondsPerPacket = this.getMaximumPacketSendTime() || 200;
  var timeToExpectedLastPacket = (millisecondsPerPacket * numberOfPackets) + params.rtt;

  var proms = []
  for (var i = 0; i < numberOfPackets; i++  ){
    pipe[i] = new Interest(name.getPrefix(-1).appendSegment(i));
    pipe[i].setInterestLifetimeMilliseconds(timeToExpectedLastPacket);
    pipe[i].setMustBeFresh(params.mustBeFresh)
    proms.push(this.expressInterest(pipe[i])
                  .then(function(response){
                    return response.data;
                  }).catch(function(er){
                    console.log("pipeline error",er)
                  }));
  }

  return Promise.all(proms);
};

Node.prototype.fetch = function Node_fetch(params){
  var prefix    = new Name(params.prefix)
    , versioned = params.versioned
    , chained = params.chained
    , onProgress = params.onProgress
    , self = this
    , mustBeFresh = params.mustBeFresh || true;

  var firstInterest = new Interest(prefix);
  firstInterest.setInterestLifetimeMilliseconds(4000);
  var minSuffix = (versioned) ? 3 : 2;
  var maxSuffix = minSuffix;
  var childSelector = (versioned) ? 1 : 0;

  //firstInterest.setMinSuffixComponents(minSuffix);
  //firstInterest.setMaxSuffixComponents(maxSuffix);
  firstInterest.setChildSelector(childSelector);
  firstInterest.setMustBeFresh(mustBeFresh);

  return self.expressInterest(firstInterest )
             .then(function(response){
               return self.pipelineFetch({
                 prefix : response.data.name.getPrefix(-1)
                 , rtt  : response.rtt
                 , mustBeFresh : mustBeFresh
                 , finalBlock  :  response.data.getMetaInfo().getFinalBlockID().toNumberWithMarker(0x00)
               });
             }).catch(function(er){
               console.log(er)
             })
};

Node.prototype.get = function Node_get(params){
  return this.fetch(params)
             .then(function (datas){
               return Node.assemble(datas);
             });
};

Node.prototype.store = function Node_store(params){
  return this.put(params, this._repository);
};

Node.prototype.steward = function Node_steward(params){
  var self = this;
  return this.fetch(params)
             .then(function(datas){
               var proms = [];
               for (var i in datas)
                 proms.push(self._repository.insert(datas[i]));
               return Promise.all(proms);
             });
};

Node.prototype.getRemotes = function Node_getRemotes(){

}

Node.prototype.getProfile = function Node_getProfile(){

}

Node.prototype.setProfile = function Node_setProfile(){

}

Node.prototype.advertiseRoute = function Node_advertiseRoute(){

}

Node.prototype._interest_pool = [];
Node.prototype._data_pool = [];


Node.prototype.createInterest = function Node_createInterest(element){
  var interest = this._interest_pool.pop() || new Interest();
  interest.wireDecode(element, TlvWireFormat.get());
  return interest;
};

Node.prototype.recycleInterest = function Node_recycleInterest(interest){
  this._interest_pool.push(interest)
}

Node.prototype.createData = function Node_createData(element){
  var data = this._data_pool.pop() || new Data();
  data.wireDecode(element, TlvWireFormat.get());
  return data;
};

Node.prototype.recycleData = function Node_recycleData(data){
  this._data_pool.push(data);
}

Node.prototype.onRecievedElement = function Node_onRecievedElement(element, face){
  var self
  if (element[0] == Tlv.Interest || element[0] == Tlv.Data) {
    var decoder = new TlvDecoder (element);
    if (decoder.peekType(Tlv.Interest, element.length)) {
      var interest = this.createInterest(element);
      this.onInterest(interest, face)
          .then(this.recycleInterest);
    }
    else if (decoder.peekType(Tlv.Data, element.length)) {
      var data = this.createData(element);
      this.onData(data, face)
          .then(this.recycleData);
    }
  }
};

Node.prototype.listen = require("./util/server.js");

Node.prototype.connect = require("./util/connect.js");

module.exports = Node;
