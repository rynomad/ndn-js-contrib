var ContentStore = require("../src/DataStructures/ContentStore.js")
var assert = require("assert");
ndn = require('ndn-js');
var keyChain = require("./setup/key-chain.js").keyChain
var certificateName = require("./setup/key-chain.js").certificateName



describe("ContentStore", function(){
  //console.log(cache.__proto__)
  describe("setMaxPackets(int)",function(){
    it('should be returned by .getMaxPackets()',function(){
      var cs = new ContentStore()
      cs.setMaxPackets(100)
      assert(cs.getMaxPackets() === 100)
    })
  })

  describe("insert(data)",function(){
    var cs = new ContentStore();
    before(function(){
      cs.setKeyChain(keyChain)
    })

    it("should return a promise",function(done){
      cs.insert(new ndn.Data(new ndn.Name("a/b/c"), "hello world"))
        .then(function(){
          done()
        }).catch(function(){
          done()
        })

    })

    it("should reject usnigned data",function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      cs.insert(dat).then(function(){
          assert(false)
        })
        .catch(function(er){
          done()
        })
    })

    it("should reject if data is duplicate", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/c"), "hello world")
      keyChain.sign(dat, certificateName, function (){
        cs.insert(dat).then(function(){
            return cs.insert(dat)
          })
          .catch(function(er){
            done();
          })
      } );
    })

    it("should resolve for signed data", function(done){
        var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
        keyChain.sign(dat, certificateName, function (){
          cs.insert(dat).then(function(){
              done();
            })
            .catch(function(er){
              console.log(er.stack)
              assert(false);
            })
        } );


    })

    it("should reject unsigned data",function(){

    })
  })

  describe("lookup(Interest)",function(){
    it("should return a promise",function(){

    })

    it("should resolve for inserted data", function(){

    })

    it("should resolve rightMost", function(){

    })

    it("should resolve rightMost with Exclude", function(){

    })

    it("should resolve rightMost with minSuffix", function(){

    })

    it("should reject for excluded match", function(){

    })

    it("should reject for no match", function(){

    })

    it("should reject for minSuffix > tree height", function(){

    })

    it("should reject for maxSuffix < shortest data", function(){

    })

    it("should reject for mustBeFresh and stale content",function(){

    })
  })

})
