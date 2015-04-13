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
    it("should return a promise",function(done){
      fib.lookup(new ndn.Interest(new ndn.Name("test/interest/fib/lookup")))
         .then(function(results){
           done()
         }).catch(function(){
           done()
         })
    })

  })

})
