
var ContentStore = require("../../src/DataStructures/ContentStore.js")
  , NameTree = require("../../src/DataStructures/NameTree.js")
  , ndn = require('ndn-lib')
  , assert = require('chai').assert

NameTree.installModules(ndn);

var cache = new ContentStore(new NameTree())

var entry, d;
describe("csEntry",function(){
  it("should set to node", function(){
      d = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
    d.signedInfo.setFreshnessPeriod(100)
    d.signedInfo.setFields()

    d.sign()
    var el = d.wireEncode().buffer
    cache.insert(el, d)
    assert(cache.nameTree.lookup(d.name).csEntry.name.equals(d.name))
  })
  it("should be consumed", function(done){
    setTimeout(function(){
      assert(!cache.nameTree.lookup(d.name).csEntry)
      done();
    },101)
  })
})
var aa = new ndn.Data(new ndn.Name("a/aa/c/a"),new ndn.SignedInfo(),"testContent")
,bb = new ndn.Data(new ndn.Name("a/aa/c/d"),new ndn.SignedInfo(),"testContent")
,cc= new ndn.Data(new ndn.Name("a/b/a/d"),new ndn.SignedInfo(),"testContent")

,dd = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
,ee = new ndn.Data(new ndn.Name("a/b/ee/d"),new ndn.SignedInfo(),"testContent")
,ff = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
,gg = new ndn.Data(new ndn.Name("a/aa/ee/d/e/f/g"),new ndn.SignedInfo(),"testContent")

aa.signedInfo.setFreshnessPeriod(1000)
bb.signedInfo.setFreshnessPeriod(1000)
cc.signedInfo.setFreshnessPeriod(1000)
dd.signedInfo.setFreshnessPeriod(1000)
ee.signedInfo.setFreshnessPeriod(1000)
ff.signedInfo.setFreshnessPeriod(1000)
gg.signedInfo.setFreshnessPeriod(1000)

cache.insert( aa.wireEncode().buffer, aa)
    .insert( bb.wireEncode().buffer, bb)
    .insert( cc.wireEncode().buffer,cc)
    .insert( dd.wireEncode().buffer, dd)
    .insert( ee.wireEncode().buffer, ee)

    .insert( ff.wireEncode().buffer, ff)

    .insert( gg.wireEncode().buffer, gg)

//console.log(cache.nameTree)
//console.log(cache.nameTree['/a'].children.length, cache.nameTree['/a'].children.length, cache.nameTree['/a/aa'].children[0].children[0].prefix.toUri())
describe("ContentStore", function(){
  //console.log(cache.__proto__)
    it("should insert", function(){

      var el = dd.wireEncode()
      cache.insert(el.buffer, dd)
      assert(cache.nameTree.lookup(dd.name).csEntry.name.equals(dd.name))
    })
    it("should find leftmost", function(){
      var inst = new ndn.Interest(new ndn.Name("a"))
      var res = cache.check(inst)
     // console.log(cache.nameTree)
      //console.log(ndn.DataUtils.arraysEqual(res, cc.wireEncode().buffer))
      assert.deepEqual(res, cc.wireEncode().buffer)
    })
    it("should find rightMost", function(){
      var i = new ndn.Interest(new ndn.Name("a"))
      i.setChildSelector(1)
      assert.deepEqual(cache.check(i), gg.wireEncode().buffer)
    })
    it("should find rightMost with Exclude", function(){
      var i = new ndn.Interest(new ndn.Name("a"))
      i.setChildSelector(1)
      i.setExclude(new ndn.Exclude([new ndn.Name.Component("aa")]))
     //console.log(cache.nameTree)
      assert.deepEqual(cache.check(i), ee.wireEncode().buffer)
    })
    it("should find rightMost with minSuffix", function(){
      var i = new ndn.Interest(new ndn.Name("a/aa"))
      i.setChildSelector(1)
      i.setMinSuffixComponents(4)
     //console.log(cache.nameTree)
      assert.deepEqual(cache.check(i), gg.wireEncode().buffer)
    })
    it("should return null for exclude", function(){
      var i = new ndn.Interest(new ndn.Name('a'))
      i.setExclude(new ndn.Exclude([new ndn.Name.Component('b'), new ndn.Name.Component('aa')]))
      assert(!cache.check(i))
    })
    it("should return null for no match", function(){
      var i = new ndn.Interest(new ndn.Name("c"))
      assert(!cache.check(i))
    })
    it("should return null for minSuffix", function(){
      var i = new ndn.Interest(new ndn.Name("/"))
      i.setMinSuffixComponents(9)
      assert(!cache.check(i))
    })
    it("should return null for maxSuffix", function(){
      var i = new ndn.Interest(new ndn.Name("/"))
      i.setMaxSuffixComponents(2)
      assert(!cache.check(i))
    })
    it("should all fail after freshness timeout", function(done){
      var i = new ndn.Interest(new ndn.Name(''))
      assert(cache.check(i))
      setTimeout(function(){assert(!cache.check(i)); done()}, 1001)
    })
})
