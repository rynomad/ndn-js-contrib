var assert = require("assert")
var FIB = require("./../src/DataStructures/FIB.js")
var ndn = require("ndn-js");


describe("FIB", function(){
  describe("Entry",function(){
    describe("addNextHop(face)",function(){

    })
    describe("getNextHops()",function(){

    })

    describe("removeFace(face)",function(){

    });
  });

  describe("insert(prefix, face)", function(){
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

    it("should reject a duplicate face", function(){
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

    it("should resolve with all matches", function(){
      fib.insert(new ndn.Name("test/insert/f1"), f1)
         .then(function(){
           return fib.insert(new ndn.Name("test/insert/f1/f2"), f2)
         }).then(function(){
           return fib.insert(new ndn.Name("test/insert/f1/f2/f3"), f3)
         }).then(function(){
           return fib.lookup(new ndn.Interest(new ndn.Name("test/insert/f1/f2/f3/term")))
         }).then(function(results){
           assert(results.length === 3)
           assert(results[0].face === f1)
           assert(results[1].face === f2)
           assert(results[2].face === f3)
           done()
         })
    })

    it("should resolve with de-duplicated nexthops", function(){
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
