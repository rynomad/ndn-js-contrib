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

  describe("insert(node)",function(){
    it("should return a promise",function(){

    })

    it("should fail if data fails to verify",function(){

    })

    it("should insert", function(){

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
