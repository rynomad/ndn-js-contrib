
var FIB = require('../../lib/FIB.js')
  , NameTree = require("../../lib/NameTree.js")
  , ndn = require('ndn-lib')
  , assert = require('assert')


FIB.installNDN(ndn);
NameTree.installModules(ndn);

var fib = new FIB(new NameTree())

describe('FIB.addEntry()', function(){
  it('should add without error with object param or class', function(){
    var param1= {
      prefix : 'a/b/c',
      nextHops:[
        {
          faceID: 1,
          cost: 0
        }
      ]
    }
    var param2 = {
      prefix: new ndn.Name("a/b/c")
      , nextHops: [{
        faceID: 0
      }]
    }

    var entry = new FIB.Entry(param1);

    fib.addEntry(entry)
    fib.addEntry(param2);
    assert(fib.nameTree["/a/b/c"].fibEntry.nextHops.length == 2)
  })
  it("should ignore existing nextHop with identical faceID", function(){
    var param3 = {
      prefix: new ndn.Name("a/b/c")
      , nextHops: [{
        faceID: 0
      }]
    }

    fib.addEntry(param3);

    assert(fib.nameTree["/a/b/c"].fibEntry.nextHops.length == 2)
  })
})
var entry
describe("FIB.Entry.addNextHop()", function(){
  it("should add, but not duplicate, a nextHop", function(){
    entry = new FIB.Entry({prefix: 'a'})
    var hop0 = {faceID: 0}
    var hop1 = {faceID: 1}
    var hop2 = {faceID: 2}
    var hop3 = {faceID: 3}
    entry.addNextHop(hop3).addNextHop(hop1).addNextHop(hop2).addNextHop(hop0).addNextHop(hop1)
    assert(entry.nextHops.length == 4)
  })
  it("should order them by faceID", function(){
    assert(entry.nextHops[0].faceID == 0)
    assert(entry.nextHops[1].faceID == 1)
    assert(entry.nextHops[2].faceID == 2)
    assert(entry.nextHops[3].faceID == 3)
  })
})

describe("FIB.findAllNextHops()", function(){
  it("should return a faceFlag with all next Hops, ignoring exclude ", function(){
    var param = {
      prefix: new ndn.Name("a/")
      , nextHops: [{
        faceID: 7
      }]
    }
    fib.addEntry(param);
    var faceFlag = fib.findAllNextHops(new ndn.Name("a/b/c/d"), 0);
    assert(faceFlag == 130)
  })
})
