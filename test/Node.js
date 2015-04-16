var assert = require('assert')
var Node = require("../src/DataStructures/Node.js")
var testFile = require("./env/file-chunk-test.js")
var testJson = require("./env/test-json.js")
var serverConfigs = require("./env/server-test.js")
var ndn = require("ndn-js");

function create(handle, done){
  Node.create()
      .then(function(node){
        handle.node = node;
        done()
      }).catch(function(err){
        console.log(err)
        done()
      })
}

describe("Node", function(){
  describe("Static Methods", function(){
    describe("create()",function(){

    })

    describe("assemble(dataArray)",function(){

    })

    describe("getFileChunks",function(){
      it("should return a promise",function(){

      })

      it("should resolve to an object with an Iterator",function(){

      })

      it("Iterator should return promises with chunk, segmentnumber arguments",function(){

      })
    })

    describe("getBufferChunks(Buffer)",function(){

    })

    describe("getStringChunks(string)",function(){

    })
  })

  describe("onData(data, face)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })
  })

  describe("onInterest(interest, face)",function(){

    var handle = {}
    before(function(done){
      create(handle,done);
    })

  })

  describe("putData(data, store)",function(){
    var handle = {}
    before(function(done){
      create(handle,function(){
        handle.onData = function(){
          handle.done()
        }
        handle.face = {
          putData: function(data){
            handle.done(data)
          }
        }
        var interest = new ndn.Interest(new ndn.Name("putData/interest"))
        interest.setInterestLifetimeMilliseconds(100000)
        handle.node
              ._pit
              .insert(interest, handle.onData)
              .then(function(){
                done();
              })
              .catch(function (err){
                console.log(err, err.stack)
              })
      });
    })

    it("should return a promise",function(done){
      handle.node.putData(new ndn.Data(new ndn.Name("putData/promise"), "helloworld"))
            .then(function(){
              done();
            })
            .catch(function(err){
              done();
            })
    });

    it("should resolve with an array [insertResult, forwardResult]",function(done){

      handle.node
            .putData(new ndn.Data(new ndn.Name("putData/promise/test"), "hello world" ))
            .then(function(arr){
              assert(arr[0])
              assert(arr[1] === false, "should not have gotten a forwarding entry");
              done()
            }).catch(function (err){
              console.log(err, err.stack)
            })

    } )

    it("should trigger matching entries in the PIT", function(done){
      handle.done = done;
      handle.node
            .putData(new ndn.Data(new ndn.Name("putData/interest/test"), "insertSUCCESS" ))
            .then(function(arr){
              assert(arr[0]._data.content.toString() === "insertSUCCESS")
              assert(arr[1] === false, "should not have gotten a returned face value");
            }).catch(function (err){
              console.log(err, err.stack)
            })
    })

    it("should send to matching entries in the PIT", function(done){
      handle.done = done()
      var interest = new ndn.Interest(new ndn.Name("putData/face"))
      interest.setInterestLifetimeMilliseconds(100000)
      handle.node
            ._pit
            .insert(interest, function(dat, face){
              return handle.face;
            }).then(function(){
              return handle.node
                      .putData(new ndn.Data(new ndn.Name("putData/face/interest/test"), "insertSUCCESS" ))
            })
            .then(function(arr){
              assert(arr[0]._data.content.toString() === "insertSUCCESS")
              assert(arr[1] === false, "should not have gotten a returned face value");
            }).catch(function (err){
              console.log(err, err.stack)
            })
    })

  })

  describe("put(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(done){
      handle.node.put(
        {
          type: "string"
          , data : "Hello world n stuff"
          , prefix : "test/insert/string"
        }
      ).then(function(){
        done();
      }).catch(function(){
        done();
      })
    });

    it("should only resolve if  type, data, or prefix fields in params", function(done){
      handle.node.put(
        {
          type: "string"
          , prefix : "test/no/data"
        }
      ).then(function(){
        assert(false, "resolved with missing data ")
      }).catch(function(){
       return handle.node.put({
         type: "string"
         , data: "somedata"
       })
     }).then(function(){
       assert(false, "resolved with missing prefix")
     }).catch(function(err){
       return handle.node.put({
         data:"dfsadfafads"
         , prefix: "test/no/type"
       })
     }).then(function(){
       assert(false, "resolved with missing type")
     }).catch(function(res){
       return handle.node.put({
         data:"dfsadfafads"
         , prefix: "test/no/type"
         , type: "string"
       })
     }).then(function(){
       done();
     }).catch(function(err){
       console.log(err)
     })
    })

    it("should resolve for file",function(done){
      console.log("TeSFILE",testFile)
      handle.node.put({
        type: "file"
        , prefix: "test/put/file"
        , data: testFile
      }).then(function(){
        done()
      }).catch(function(er){
        console.log(er, er.stack)
      })
    })

    it("should resolve for json",function(done){
      handle.node.put({
        type: "json"
        , prefix: "test/p/json"
        , data: testJson
      }).then(function(){
        done()
      }).catch(function(er){
        console.log(er, er.stack)
      })
    })

    it("should resolve for buffer", function(done){
      handle.node.put({
        type: "buffer"
        , prefix: "test/p/json"
        , data: new Buffer(10000)
      }).then(function(){
        done()
      }).catch(function(er){
        console.log(er, er.stack)
      })
    })
  })

  describe("expressInterest(interest, onData)",function(){
    var handle = {}
    handle.face = {
      putData: function(data){
        console.log("handle.face.putData")
        handle.done(data)
      }
    }
    before(function(done){
      create(handle,done);
    })
    it("should return a promise",function(done){
      handle.node
            .expressInterest(new ndn.Interest(new ndn.Name("express/interest")))
            .then(function(data, face, rtt){
              done()
            })
            .catch(function(er){
              done()
            })
    });

    it("should return data from local contentStore", function(done){
      var data = new ndn.Data(new ndn.Name("test/express/interest"), "SUCCESS")
      handle.node
            .putData(data)
            .then(function(){
              return handle.node.expressInterest(new ndn.Interest(data.name))
            })
            .then(function(response){
              console.log(response, typeof response.rtt)
              assert(typeof response.rtt === "number", "roundTripTime not a number")
              assert(response.data.content.toString() === "SUCCESS", "")
              done()
            })
    })

    it("should putData to matching fib face", function(done){
      handle.done = function(data){
        console.log("heres?")
        assert(data.name.get(-1).toEscapedString = "interest")
        done();
      }
      handle.node
            ._fib
            .insert(new ndn.Name("test/express/interest/fib"), handle.face)
            .then(function(){
              console.log("fib entry inserted")
              return handle.node.expressInterest(new ndn.Interest(new ndn.Name("test/express/interest/fib/interest")))
            })
    })
  })

  describe("pipelineFetch(data, roundTripTime)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(){

    });
  })

  describe("fetch(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })
    it("should return a promise",function(){

    });
  })

  describe("get(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    });

    it("should return a promise",function(){

    });
  })

  describe("store(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(){

    });
  })

  describe("steward(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(){

    });
  })

  describe("putStream",function(){

  })

  describe("getStream",function(){

  })

  describe("listen(param)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })
    it("should return a promise",function(){

    });
  })



})
