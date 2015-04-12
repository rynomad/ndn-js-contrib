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
    it("should return a Promise", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/promise"));
      pit.insert(interest)
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
      pit.insert(interest)
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
      pit.insert(interest)
         .then(function(intd){
           assert(interest.name.equals(intd.name))
           return pit.insert(interest)
         })
         .then(function(interest){
           assert(false, "this should have rejected")
         })
         .catch(function(er){
           done();
         })
    })

    it("should autoremove after timeout", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/pit/insert/timeout"));
      interest.setNonce([1,2,3,4])
      this.timeout(600);
      interest.setInterestLifetimeMilliseconds(500);
      pit.insert(interest)
         .then(function(intd){
           assert(pit._nameTree.get(intd.name).getItem()._entries.length === 1);
           setTimeout(function(){
             assert(pit._nameTree.get(intd.name).getItem()._entries.length === 0, "failed to remove interest after timeout")
             done();
           }, 500)
         });
    })
  })

  describe("lookup(data)",function(){
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
    it("should resove with all matching   entries", function(done){
      done()
    })

    it("should reject if no matching entries", function(done){
      done()
    })

    it("should consume matched entries", function(done){
      done()
    })
  })
})
