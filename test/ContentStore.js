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
      });
    })

    it("should mark as stale after freshnessMilliseconds", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      dat.getMetaInfo().setFreshnessPeriod(500)
      ContentStore.Node.prototype.onDataStale = function(){
        ContentStore.Node.prototype.onDataStale = function(){}
        done();
      }
      keyChain.sign(dat, certificateName, function (){
        cs.insert(dat)
      });
    })
  })

  describe("lookup(Interest)",function(){
    var cs = new ContentStore();
    console.log(cs.keyChain)
    before(function(done){
      cs.insert(new ndn.Data(new ndn.Name("test/interest/lookup/2"), "SUCCESS"))
        .then(function(){
          done()
        })
    })
    it("should return a promise",function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"))
      cs.lookup(interest)
        .then(function(){
          done();
        }).catch(function(){
          done();
        })
    })

    it("should resolve for inserted data", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"))
      interest.setMustBeFresh(false)
      cs.lookup(interest)
        .then(function(){
          done();
        }).catch(function(er){
          console.log(er, er.stack)
          assert(false);
        })
    })

    it("should resolve rightMost", function(done){
      var right = new ndn.Data(new ndn.Name("test/interest/lookup/9"), "SUCCESS")
      var left = new ndn.Data(new ndn.Name("test/interest/lookup/1"), "FAIL")
      cs.insert(right)
        .then(function(){
          console.log(left.content, right.content)
          return cs.insert(left)
        })
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"))
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          console.log("here?")
          return cs.lookup(interest)
        })
        .then(function(data){
          console.log(data.name.toUri())
          if (data.content.toString() == "SUCCESS")
            done()
          else
            assert(false, "did not return the right data")
        }).catch(function(er){
          console.log("failed?", er, er.stack)
          assert(false, er + er.stack)
        })

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
