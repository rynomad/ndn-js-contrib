var classes = require("../../../debug.js")
var ContentStore = classes.ContentStore;
var NameTree = classes.NameTree
var ndn = classes.ndn;
var RepoEntry = require("../../../src/DataStructures/repoEntry.js")
var DataBase = require("../../../src/DataStructures/Repository.js")
var assert = require("assert")
var dd, repo;
var nameTree = new NameTree()
var path = (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH) + "/.NDN-RepoDBTest";

DataBase.installNDN(classes.ndn)


  var aa = new ndn.Data(new ndn.Name("a/aa/c/a"),new ndn.SignedInfo(),"testContent")
  ,bb = new ndn.Data(new ndn.Name("a/aa/c/d"),new ndn.SignedInfo(),"testContent")
  ,cc= new ndn.Data(new ndn.Name("a/b/a/d"),new ndn.SignedInfo(),"testContent")


  ,ee = new ndn.Data(new ndn.Name("a/b/ee/d"),new ndn.SignedInfo(),"testContent")
  ,gg = new ndn.Data(new ndn.Name("a/aa/ee/d/e/f/g"),new ndn.SignedInfo(),"testContent")

  aa.signedInfo.setFreshnessPeriod(100)
  bb.signedInfo.setFreshnessPeriod(100)
  cc.signedInfo.setFreshnessPeriod(100)
  ee.signedInfo.setFreshnessPeriod(100)
  gg.signedInfo.setFreshnessPeriod(100)

var index = new ContentStore(nameTree, RepoEntry)
function start(){


  repo = new DataBase(index, {path: path}, function(){
  RepoEntry.installDatabase(repo);



  repo.insert( aa.wireEncode().buffer,  aa)
  .insert( bb.wireEncode().buffer,  bb)
  .insert( cc.wireEncode().buffer, cc)
  .insert( ee.wireEncode().buffer, ee)
  .insert( gg.wireEncode().buffer, gg)

});
}
  /*
*/
describe("repoEntry",function(){
  before(start)
  it("should set to node", function(done){
      d = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
    d.signedInfo.setFreshnessPeriod(50)
    d.signedInfo.setFields()

    d.sign()
    var el = d.wireEncode().buffer
    repo.insert( el, d, function(){
      assert(index.nameTree.lookup(d.name).repoEntry.element);
      console.log("callind done()")
      done()
    })


  })
  it("element should be consumed, but leave entry", function(done){
    setTimeout(function(){
      assert(!index.nameTree.lookup(d.name).repoEntry.element)
      assert(index.nameTree.lookup(d.name).repoEntry)
      done()
    },150)
  })
  //console.log(cache.__proto__)
  it("should insert", function(done){

    dd = new ndn.Data(new ndn.Name("a/b/c/d"),new ndn.SignedInfo(),"testContent")
    dd.signedInfo.setFreshnessPeriod(1000)
    var el = dd.wireEncode()
    var dat = dd
    repo.insert(el.buffer, dd, function(){
      assert(index.nameTree.lookup(dd.name).repoEntry.name.equals(dat.name))
      done()
    })
  })
  it("should find leftmost before timeout", function(done){


    var inst = new ndn.Interest(new ndn.Name("a"))
    var res = repo.check(inst, function(err, element){
      //console.log("repo check",element)
      assert.deepEqual(element, cc.wireEncode().buffer)
      done()
    })
    })
  it("should find rightMost after timeout", function(done){
    var i = new ndn.Interest(new ndn.Name("a"))
    i.setChildSelector(1)
    setTimeout(function(){
      var res = repo.check(i, function(err, element){
        assert.deepEqual(element, gg.wireEncode().buffer)
        done()
      })

      }, 60)
  })
  it("should find rightMost with Exclude", function(done){
    var i = new ndn.Interest(new ndn.Name("a"))
    i.setChildSelector(1)
    i.setExclude(new ndn.Exclude([new ndn.Name.Component("aa")]))
    var res = repo.check(i, function(err, element){
      assert.deepEqual(element, ee.wireEncode().buffer)
      done()
    })
    })
  it("should find rightMost with minSuffix", function(done){
    var i = new ndn.Interest(new ndn.Name("a/aa"))
    i.setChildSelector(1)
    i.setMinSuffixComponents(4)
    //console.log(cache.nameTree)
    var res = repo.check(i, function(err, element){
      assert.deepEqual(element, gg.wireEncode().buffer)
      done()
    })
    })
  it("should return null for exclude", function(done){
    var i = new ndn.Interest(new ndn.Name('a'))
    i.setExclude(new ndn.Exclude([new ndn.Name.Component('b'), new ndn.Name.Component('aa')]))
    var res = repo.check(i, function(err, element){
      assert(!element)
      done()
    })
    })
  it("should return null for no match", function(done){
    var i = new ndn.Interest(new ndn.Name("c"))
    var res = repo.check(i, function(err, element){
      assert(!element)
      done()
    })
    })
  it("should return null for minSuffix", function(done){
    var i = new ndn.Interest(new ndn.Name("/"))
    i.setMinSuffixComponents(9)
    var res = repo.check(i, function(err, element){
      assert(!element, "should not have gotten element back" + element)
      done()
    })
    })
  it("should return null for maxSuffix", function(done){
    var i = new ndn.Interest(new ndn.Name("/"))
    i.setMaxSuffixComponents(2)
    var res = repo.check(i, function(err, element){
      assert(!element)
      done()
    })
    })
  it("should succeed long after freshness timeout", function(done){
    var i = new ndn.Interest(new ndn.Name(''))
    setTimeout(function(){
      repo.check(i, function(err, element){
        assert(element)
        done()
      })
    }, 1001)
  })
})
