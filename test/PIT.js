var PIT = require("../src/DataStructures/PIT.js");
var assert = require("assert")
var ndn = require("ndn-js")

describe("PIT", function(){
  describe("Node",function(){
    describe("constructor",function(){

    })
  })

  describe("insert(interest, onData)",function(){
    var pit = new PIT()
     ,  onD = function(){};
    it("should return a Promise", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/promise"));
      pit.insert(interest, onD)
         .then(function(){
           done()
         })
        .catch(function(){
          done()
        })
    })

    it("should resolve with interest", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/resolve"));
      interest.setInterestLifetimeMilliseconds(1000);
      pit.insert(interest, onD)
         .then(function(intd){
           assert(interest.name.equals(intd.name))
           done()
         })
        .catch(function(){
          assert(false, "rejected for some reason")
        })
    })

    it("should reject if duplicate", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/duplicate"));
      interest.setNonce([1,2,3,4])
      interest.setInterestLifetimeMilliseconds(1000);
      pit.insert(interest, onD)
         .then(function(intd){
           assert(interest.name.equals(intd.name))
           return pit.insert(interest, onD)
         })
         .then(function(interest){
           assert(false, "this should have rejected")
         })
         .catch(function(er){
           done();
         })
    })

    it("should reject if typeof onData !== function",function(done){
      var inst = new ndn.Interest(new ndn.Name("dfa/adfad/adf"))
      pit.insert(inst)
         .then(function(res){
           assert(false, "promise resolved with undefined onData")
         })
         .catch(function(er){
           return pit.insert(inst, 5)
         })
         .then(function(res){
           assert(false, "promise resolved with integer onData")
         })
         .catch(function(er){
           done()
         })
    })

    it("should autoremove after timeout", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/timeout"));
      interest.setNonce([1,2,3,4])
      this.timeout(600);
      interest.setInterestLifetimeMilliseconds(500);
      pit.insert(interest, onD)
         .then(function(intd){
           assert(pit._nameTree.get(intd.name).getItem()._entries.length === 1);
           setTimeout(function(){
             assert(pit._nameTree.get(intd.name).getItem()._entries.length === 0, "failed to remove interest after timeout")
             done();
           }, 500)
         });
    })
  })

  describe("lookup(data, face)",function(){
    var pit = new PIT();
    it("should return a Promise", function(done){
      var data = new ndn.Data(new ndn.Name("test/pit/lookup/data/promise"))
      pit.lookup(data)
         .then(function(){
           done();
         })
         .catch(function(){
           done();
         })
    })
    it("should resolve with all matching   entries", function(done){
      var name = new ndn.Name("")
      var proms = [];
      for (var i = 0; i < 5; i++)
        proms.push(pit.insert(new ndn.Interest(name.append("comp")), function(){ return Math.random()}))
      Promise.all(proms)
        .then(function(res){
          var data = new ndn.Data(name, "test")
          return pit.lookup(data)
        })
        .then(function(res){
          assert(res.length === 5)
          done()
        })
        .catch(function(er){
          console.log(er)
          assert(false)
        })
      })

    it("should reject if no matching face returning entries", function(done){
      var data = new ndn.Data(new ndn.Name("no/matches/at/all"), "fail")

      pit.lookup(data)
         .then(function(res){
           assert(false, "shouldn't be getting any responses")
         })
         .catch(function(){
           done()
         });
    })

    it("should consume matched entries", function(done){
      var name = new ndn.Name("")
      var proms = [];
      for (var i = 0; i < 5; i++){
        var int = new ndn.Interest(name.append("co"))
        int.setInterestLifetimeMilliseconds(10000)
        proms.push(pit.insert(int, function(){return Math.random()}))
      }

      Promise.all(proms)
        .then(function(){
          return pit.lookup(new ndn.Data(name, "test"))
        })
        .then(function(res){
          assert(res.length === 5)
          return pit.lookup(new ndn.Data(name, "fail"))
        })
        .then(function(){
          assert(false, "pit entries are not getting consumed")
        })
        .catch(function(){
          done()
        })
    })

    it("should execute onData(data, face)", function(done){
      var inst = new ndn.Interest(new ndn.Name("test/onData/callback"))
      inst.setInterestLifetimeMilliseconds(1000)
      function onData (data, face){
        done()
      }
      pit.insert(inst, onData)
         .then(function(interest){
           return pit.lookup(new ndn.Data(new ndn.Name("test/onData/callback"), "SUCCESS"));
         })
         .then(function(results){
           assert(false)
         });
    })


    it("should clear timeouts on matched entries", function(done){
      var name = new ndn.Name("test/clear/timeout")
      var interest = new ndn.Interest(name)
      var saveClearTimeout = global.clearTimeout
      global.clearTimeout = function(id){
        done()
        global.clearTimeout = saveClearTimeout;
        clearTimeout(id);
      }
      var data = new ndn.Data(name, "test")
      interest.setInterestLifetimeMilliseconds(10000)
      pit.insert(interest, function(){})
         .then(function(){
           return pit.lookup(data);
         }).catch(function(er){
           console.log(er)
         })
    })
  })
})
