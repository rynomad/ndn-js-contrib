
var NameTree = require('../../src/NameTree.js')
  , ndn = require('ndn-lib')
  , assert = require('assert')

NameTree.installModules(ndn);
var nameTree = new NameTree();

describe('NameTree.addNode()', function(){
  it('should add without error from string && prefix', function(){
    nameTree.addNode("some/test/c");  // [2]
    nameTree.addNode("some/test/a");  // [0]

    nameTree.addNode(new ndn.Name("some/test/aaa"));// [4]
    nameTree.addNode("some/test/aab");// [5]
    nameTree.addNode("some/test/aaabb");// [7]

    nameTree.addNode(new ndn.Name("some/test/aba"));// [6]
    nameTree.addNode("some/test/b");  // [1]
    nameTree.addNode("some/test/ab"); // [3]
  })

  it('should populate ancestors', function(){

    assert(nameTree["/some/test/a"]
           , "nameTree['/some/test/a'] does not exist");
    assert(nameTree["/some/test"]
           , "nameTree['/some/test'] does not exist");
    assert(nameTree["/some"]
           , "nameTree['/some'] does not exist");
    assert(nameTree["/"]
           , "nameTree['/'] does not exist");
  })
  it('should populate .parent property of nodes', function(){
    assert(nameTree['/some/test/a'].parent
           ,"nameTree['/some/test/a'].parent does not exist")
    assert(nameTree['/some/test/a'].parent.parent
           ,"nameTree['/some/test/a'].parent.parent does not exist")
    assert(nameTree['/some/test/a'].parent.parent.parent
           ,"nameTree['/some/test/a'].parent.parent.parents does not exist")
    assert(nameTree['/some/test/a'].parent.prefix.equals(nameTree['/some/test'].prefix)
           , "nameTree['/some/test/a'].parent.prefix != nameTree['/some/test'].prefix")
  })
  it('should populate .children array of nodes', function(){
    assert(nameTree['/some/test'].children.length == 8
           ,"nameTree['/some/test'].children.length is not 8");

    assert(nameTree['/some/test'].children[0].prefix.equals(nameTree['/some/test/a'].prefix)
           , "nameTree['/some/test/a'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[4].prefix.equals(nameTree['/some/test/aaa'].prefix)
           , "nameTree['/some/test/aaa'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[3].prefix.equals(nameTree['/some/test/ab'].prefix)
           , "nameTree['/some/test/ab'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[6].prefix.equals(nameTree['/some/test/aba'].prefix)
           , "nameTree['/some/test/aba'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[1].prefix.equals(nameTree['/some/test/b'].prefix)
           , "nameTree['/some/test/b'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[2].prefix.equals(nameTree['/some/test/c'].prefix)
           , "nameTree['/some/test/c'] is out of order in .parent.children array");

    assert(nameTree['/some/test'].children[5].prefix.equals(nameTree['/some/test/aab'].prefix)
           , "nameTree['/some/test/aab'] is out of order in .parent.children array");
  })

})

describe("NameTree.removeNode()", function(){
  it("should remove node and all children",function(){
    nameTree.removeNode("/some");
    assert(!nameTree["/some"], "nameTree['/some'] still exists" );
    assert(!nameTree["/some/test"], "nameTree['/some/test'] still exists");
    assert(!nameTree["/some/test/a"], "nameTree['/some/test/a'] still exists");
    assert(!nameTree["/some/test/aaa"], "nameTree['/some/test/aaa'] still exists");
    assert(!nameTree["/some/test/aaabb", "nameTree['/some/test/aaabb'] still exists"]);
    assert(!nameTree["/some/test/ab"], "nameTree['/some/test/ab'] still exists");
    assert(!nameTree["/some/test/aba"],  "nameTree['/some/test/aba'] still exists");
    assert(!nameTree["/some/test/aab"], "nameTree['/some/test/aab'] still exists");
    assert(!nameTree["/some/test/c"], "nameTree['/some/test/c'] still exists");
    assert(!nameTree["/some/test/b"],  "nameTree['/some/test/a'] still exists");
  })
})

describe("NameTree.lookup()", function(){
  it("should return existing node", function(){
    nameTree.addNode("/lookup/test")
    assert((nameTree.lookup("/lookup/test") instanceof NameTree.Node))
  })
  it("should create non existing node", function(){
    assert((nameTree.lookup("/lookup/creation/test") instanceof NameTree.Node))
    console.log("!!!!!!!!!!!!!!!!!",nameTree["/lookup"].children.length)
    assert((nameTree["/lookup"].children.length == 2));
  })
})

describe("NameTree.findLongestPrefixMatch()", function(){
  it("should return longest prefix match node", function(){
    var query = new ndn.Name("lookup/creation/test/with/suffix")
    assert((nameTree.findLongestPrefixMatch(query).prefix.components.length == 3)
            && (nameTree.findLongestPrefixMatch(query).prefix.match(query)))
  })
  it("should return based on truthiness of selector", function(){
    nameTree.lookup("/lookup").property = true;
    var query = new ndn.Name("lookup/creation/test/with/suffix")
      , predicate = function(potential){
        if (potential.property == true) return true; else return false;
      }
    assert((nameTree.findLongestPrefixMatch(query, predicate).prefix.components.length == 1)
           && (nameTree.findLongestPrefixMatch(query, predicate).prefix.match(query)))
  })
})

var iterator;
var toMatch = new ndn.Name("0/1/2/3/4/5/6")

describe("NameTree.findAllMatches", function(){
  it("should return an iterator", function(){

    nameTree.lookup(toMatch)
    iterator = nameTree.findAllMatches("0/1/2/3/4/5/6/7/8/9/0/", function(potential){
      if (!potential.prefix.equals(new ndn.Name("0/1/2/3/4")))
        return true
      else
        return false
    })
    assert(iterator.hasNext)
  })
  it("iterator should find all Matches and skip '0/1/2/3/4/' based on provided selector", function(){
    while(iterator.hasNext){
      var here = iterator.next()
      assert(here.prefix.match(toMatch))
      assert(!here.prefix.equals(new ndn.Name("0/1/2/3/4")))
    }
  })
  it("iterator.hasNext == false && iterator.next() returns null", function(){
    assert(!iterator.hasNext)
    assert(!iterator.next())
  })
})
