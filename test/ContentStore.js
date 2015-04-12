var ContentStore = require("../src/DataStructures/ContentStore.js")
var assert = require("assert");
var ndn = require('ndn-js');



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
    it("should return a promise",function(done){
      cs.insert(new ndn.Data(new ndn.Name("a/b/c"), "hello world"))
        .then(function(){
          done()
        }).catch(function(){
          done()
        })

    })

    it("should reject if data fails to verify",function(){

    })

    it("should reject if data is duplicate", function(done){
      cs.insert(new ndn.Data(new ndn.Name("a/b/d"), "hello world"))
        .then(function(){
          return cs.insert(new ndn.Data(new ndn.Name("a/b/d"), "hello world"))
        }).then(function(){
          assert(false)
        }).catch(function(er){
          done()
        })
    })

    it("should insert in loop (sync)", function(done){
      var proms = []
      for(var i = 0; i < 20; i++)
        proms.push(
          cs.insert(new ndn.Data(new ndn.Name("a/b/d/" + i), "hello world"))
        )
      Promise.all(proms)
            .then(function(){
              done();
            })
            .catch(function(){
              assert(false);
            })

    })

    it("should mark stale",function(){

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
