var PIT = require("../src/DataStructures/PIT.js");
var assert = require("assert")
var ndn = require("ndn-js")

describe("PIT", function(){
  describe("Node",function(){
    describe("constructor",function(){

    })
  })

  describe("insert(interest)",function(){
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

    it("should resolve on lookup(matchingData)", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/match/data"));
      interest.setNonce([1,2,3,4])
      interest.setInterestLifetimeMilliseconds(1000);
      interest.setMustBeFresh(false)
      pit.insert(interest)
         .then(function(res){
           assert(res.data.content.toString() === "Success")
           done()
         })

      pit.lookup(new ndn.Data(interest.name, "Success"))
    })

    it("should reject if duplicate", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/duplicate"));
      interest.setNonce([1,2,3,4])
      interest.setInterestLifetimeMilliseconds(1000);
      pit.insert(interest)
      pit.insert(interest)
         .catch(function(er){
           done()
         })
    })

    it("should reject after timeout",function(done){
      var inst = new ndn.Interest(new ndn.Name("dfa/adfad/adf"))
      pit.insert(inst)
         .catch(function(er){
           done()
         })
    })

    it("should autoremove after timeout", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/timeout"));
      interest.setNonce([1,2,3,4])
      interest.setInterestLifetimeMilliseconds(500);
      var t1 = Date.now()
      pit.insert(interest)
         .catch(function interestTimeout(){
           assert(Date.now() - t1 >= 500)
           assert(pit._nameTree.get(interest.name).getItem()._entries.length === 0, "failed to remove interest after timeout")
           done();
         })
      setTimeout(function(){
        assert(pit._nameTree.get(interest.name).getItem()._entries.length === 1);
      },3)

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
      for (var i = 0; i < 5; i++){
        proms[i] = new ndn.Interest(name.append("comp"))
        proms[i].setInterestLifetimeMilliseconds(1000)
        proms[i] = pit.insert(proms[i])
      }
      Promise.all(proms)
        .then(function(res){
          assert(res.length === 5)
          done()
        })
        .catch(function(){
          console.log("timeout?")
        })
      var data = new ndn.Data(name.append("comp"), "test")
      return pit.lookup(data);
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
          console.log("pit matched")
        })
      pit.lookup(new ndn.Data(name, "test"))
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
      pit.insert(interest)
      pit.lookup(data)
    })
  })
})
