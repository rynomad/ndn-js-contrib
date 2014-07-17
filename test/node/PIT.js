
var PIT = require('../../src/PIT.js')
  , NameTree = require("../../src/NameTree.js")
  , ndn = require('ndn-lib')
  , assert = require('chai').assert;


var pubKeyDigest = ndn.globalKeyManager.getKey().publicKeyDigest
NameTree.installModules(ndn);
var pit = new PIT(new NameTree());
var inst = new ndn.Interest(new ndn.Name("a/b"))
, enc = inst.wireEncode()
inst = new ndn.Interest()
inst.wireDecode(enc);

var entry = new PIT.Entry(enc, inst, 1)
var d11 = new ndn.Data(new ndn.Name("a/b"), new ndn.SignedInfo(), "test")
d11.signedInfo.setFields()
d11.sign()
var d22 = new ndn.Data(new ndn.Name("a/b/d"), new ndn.SignedInfo(), "test")
d22.signedInfo.setFields()
d22.sign()
describe("PIT.Entry", function(){


  it("should match exact", function(){


    assert(entry.matches(d11))
  })
  it("should match (with pubKey)", function(){
    entry.interest.publisherPublicKeyDigest = pubKeyDigest

    assert(entry.matches(d11))
  })
  it("should not match (data name too short)", function(){

    var data = new ndn.Data(new ndn.Name("a"), new ndn.SignedInfo(), "test")
    assert(!entry.matches(data))
  })
  it("should not match (data name too long)", function(){
    entry.interest.setMaxSuffixComponents(3)
    var data = new ndn.Data(new ndn.Name("a/b/c/d/e"), new ndn.SignedInfo(), "test")
    assert(!entry.matches(data))
  })
  it("should not match (data name too short)", function(){
    entry.interest.setMinSuffixComponents(2)
    var data = new ndn.Data(new ndn.Name("a/b"), new ndn.SignedInfo(), "test")
    assert(!entry.matches(data))
  })
  it("should not match (Exclude)", function(){
    entry.interest.setExclude(new ndn.Exclude([new ndn.Name.Component("c")]))
    var data = new ndn.Data(new ndn.Name("a/b/c"), new ndn.SignedInfo(), "test")
    assert(!entry.matches(data))
  })
  it("should not match (wrong pubKeyDigest)", function(){

    var newKey = new Buffer(32)
    entry.interest.publisherPublicKeyDigest = newKey;
    assert(!entry.matches(d22))

  })
})

describe("PIT", function(){
  describe("PIT.insertPitEntry", function(){
    it("should insert", function(){
      entry.interest.setInterestLifetimeMilliseconds(100)
      pit.insertPitEntry(entry)
      assert(pit.nameTree["/a/b"].pitEntries.length > 0)
    })
    it("should auto-consume", function(done){
      setTimeout(function(){
        assert(pit.nameTree["/a/b"].pitEntries.length == 0)
        done()
      },110)
    })
  })
  describe("PIT.lookup", function(){
    it("should get all matches and return a faceFlag", function(){

      var inst = new ndn.Interest(new ndn.Name("a/b/c"))
      inst.setInterestLifetimeMilliseconds(1);
      var enc = inst.wireEncode()
      inst = new ndn.Interest()
      inst.wireDecode(enc)
      var entry = new PIT.Entry(enc, inst, 1)
      var data = new ndn.Data(new ndn.Name("a/b/c/d"), new ndn.SignedInfo(), "test")
      data.signedInfo.setFields()
      entry.interest.publisherPublicKeyDigest = pubKeyDigest;
      pit.insertPitEntry(entry)
      var returns = pit.lookup(data);
      assert(returns.faces == 2)
      assert(returns.pitEntries.length == 1)
    })
  })
})
