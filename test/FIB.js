var assert = require("assert")
var FIB = require("./../src/DataStructures/FIB.js")
var ndn = require("ndn-js");


describe("FIB", function(){
  describe("Entry",function(){
    var fibEntry = new FIB.Entry();
    var face = new ndn.Face();
    describe("addNextHop(face)",function(){
      it("should return true for new face", function(){
        assert(fibEntry.addNextHop(face));
      })

      it("should return false adding the same face again", function(){
        assert(!fibEntry.addNextHop(face));
      })

      it("should actually only have one entry for that face", function(){
        assert(fibEntry._nextHops.length === 1);
      })

    })
    describe("getNextHops()",function(){
      it("should return all next hops",function(){
        fibEntry.addNextHop(new ndn.Face())
        assert(fibEntry.getNextHops().length === 2)
      })
    })

    describe("removeFace(face)",function(){
      it("should remove face",function(){
        fibEntry.removeFace(face)
        assert(fibEntry.getNextHops().length === 1)
      })
    });
  });

  describe("insert(prefix, face)", function(done){
    var fib = new FIB();
    var face = new ndn.Face()
    it("should return a promise, resolve(face) or reject(err)", function(done){
      fib.insert(new ndn.Name("test/insert/forwarding/entry"), face)
         .then(function(fce){
           assert(fce === face)
           done()
         }).catch(function(er){
           throw er;
         })
    })

    it("should reject a duplicate face", function(done){
      fib.insert(new ndn.Name("test/insert/forwarding/entry"), face)
         .then(function(fce){
           assert(false, "should have rejected this face")
         }).catch(function(er){
           done()
         })
    })
  });

  describe("lookup(interest, face)", function(){
    var fib = new FIB()
    var f1 = new ndn.Face(), f2 = new ndn.Face(), f3 = new ndn.Face()
    it("should return a promise",function(done){
      fib.lookup(new ndn.Interest(new ndn.Name("test/interest/fib/lookup")))
         .then(function(results){
           done()
         }).catch(function(){
           done()
         })
    })

    it("should resolve with all matches", function(done){
      fib.insert(new ndn.Name("test/insert/f1"), f1)
         .then(function(){
           return fib.insert(new ndn.Name("test/insert/f1/f2"), f2)
         }).then(function(){
           return fib.insert(new ndn.Name("test/insert/f1/f2/f3"), f3)
         }).then(function(){
           return fib.lookup(new ndn.Interest(new ndn.Name("test/insert/f1/f2/f3/term")))
         }).then(function(results){
           assert(results.length === 3)
           
           assert(results[0].face === f3, "results[0].face === " + results[0].face)
           assert(results[1].face === f2)
           assert(results[2].face === f1)
           done()
         }).catch(function(er){
           console.log(er, er.stack)
         })
    })

    it("should resolve with de-duplicated nexthops", function(done){
      var proms = [], name = new ndn.Name("comp")
      for (var i = 0; i < 5; i++)
        proms.push(fib.insert(name.append("dup")), f1)

      Promise.all(proms)
             .then(function(res){
               return fib.lookup(new ndn.Interest(name), f2)
             })
             .then(function(res){
               assert(res.length === 1)
               done()
             })
    })
  })

})
