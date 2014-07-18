
var ContentStore = require("../../../src/DataStructures/ContentStore.js")
, NameTree = require("../../../src/DataStructures/NameTree.js")
var assert = require("assert")
var ndn = require('ndn-lib')

function arraysEqual (ar1, ar2){
  if (ar1.length !== ar2.length ){
    console.log("length not match")
    return false
  }
  var i = 0
  while (i < ar1.length){
    if (ar1[i] !== ar2[i]){
      console.log("non matching element at index ", i, ar1[i], ar2[i])
      return false;
    }
    i++
  }
  return true;
}

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

aa.signedInfo.setFreshnessPeriod(4000)
bb.signedInfo.setFreshnessPeriod(4000)
cc.signedInfo.setFreshnessPeriod(4000)
dd.signedInfo.setFreshnessPeriod(4000)
ee.signedInfo.setFreshnessPeriod(4000)
ff.signedInfo.setFreshnessPeriod(4000)
gg.signedInfo.setFreshnessPeriod(4000)
var abuf = aa.wireEncode().buffer
var bbuf = bb.wireEncode().buffer

var cbuf = cc.wireEncode().buffer

var dbuf = dd.wireEncode().buffer

var ebuf = ee.wireEncode().buffer

var fbuf = ff.wireEncode().buffer

var gbuf = gg.wireEncode().buffer
cache.insert( abuf, aa)
.insert( bbuf, bb)
.insert( cbuf,cc)
.insert( dbuf, dd)
.insert( ebuf, ee)

.insert( fbuf, ff)

.insert( gbuf, gg)

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
    var el = cc.wireEncode().buffer
    assert.deepEqual(cbuf,res, "this didnt work")
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
    this.timeout(5000)
    assert(cache.check(i))
    setTimeout(function(){assert(!cache.check(i)); done()}, 4001)
  })
})

