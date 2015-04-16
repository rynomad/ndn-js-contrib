var assert = require('assert')
var Node = require("../src/DataStructures/Node.js")
var testFile = require("./env/file-chunk-test.js")
var serverConfigs = require("./env/server-test.js")

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
      it("should return a promise",function(){

      });
  })

  describe("onInterest(interest, face)",function(){

    var handle = {}
    before(function(done){
      create(handle,done);
    })
    it("should return a promise",function(){

    });

  })

  describe("putData(data, store)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(){

    });
  })

  describe("put(params)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })

    it("should return a promise",function(){

    });
  })

  describe("expressInterest(interest, onData)",function(){
    var handle = {}
    before(function(done){
      create(handle,done);
    })
    it("should return a promise",function(){

    });
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
