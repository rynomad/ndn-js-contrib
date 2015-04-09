
var NameTree = require('../src/DataStructures/NameTree.js')
  , ndn = require('ndn-js')
  , assert = require('assert');

var nameTree = new NameTree();

describe('NameTree', function(){
  describe('Node', function(){
    var node = new NameTree.Node(new ndn.Name(""))
      , last;

    before(function(){
      for(var i = 0; i < 1000; i++){
        last = new NameTree.Node(new ndn.Name("d" + i));
        node.insert(last)
      }
    })

    describe('equals(node)',function(){
      it('should return true if the prefix is the same', function(){
        assert(node.equals(new NameTree.Node(new ndn.Name(""))));
      })
    })

    describe('indexOf(suffix)', function(){
      it('should find 0, random, and high children', function(){
        assert((node.indexOf(last.prefix.get(-1)) > 0), "NameTree.Node.indexOf returned no result for last insertion" )
        assert((node.indexOf(node.children[0].prefix.get(-1)) === 0), "NameTree.Node.indexOf returned no result for last insertion" )
        assert((node.indexOf(node.children[node.children.length - 1].prefix.get(-1)) === node.children.length - 1), "NameTree.Node.indexOf returned no result for last insertion" )
      })

      it("should return negative value for nonexistant suffix",function(){
        assert(node.indexOf(new ndn.Name.Component("fail")) < 0 , "should not find a nonexistant nuffix");
      })
    })

    describe('updateDepth(int)', function(){
      before(function(){
        node = new NameTree.Node(new ndn.Name(""))
        node.children = [{depth:1},{depth:0},{depth:6},{depth:5}]
        node.updateDepth();
      })

      it('should return initial depth', function(){
        assert(node.depth === 7, "node depth not initialized correctly");
      })

      it('should update depth only if new depth is greater', function(){
        node.updateDepth(8);
        assert(node.depth === 8, "failed to update");

        node.updateDepth(4)
        assert(node.depth === 8, "overwrote with smaller");
      })

      it('should set to 0 if no children', function(){
        node.children = [];
        node.updateDepth();
        assert(node.depth === 0, "didnt reset with empty children, instead: " + node.depth)
      })
    })

    describe('insert(node)', function(){
      before(function(){
        node = new NameTree.Node(new ndn.Name(""))
      })

      it('should insert generated child', function(){
        node.insert(new NameTree.Node(new ndn.Name("1/2/3/4")));

        assert(node.children.length === 1, 'failed insert child')
        assert(node.children[0].prefix.size() === 1, 'failed to create correctly sized child')
      })

      it('should update depth correctly', function(){
        node.insert(new NameTree.Node(new ndn.Name("1/2/3/4/5")));
        assert(node.depth === 5, 'failed to update depth correctly, should be 5, actually ' + node.depth)


        node.insert(new NameTree.Node(new ndn.Name("2/2")));
        assert(node.depth === 5, 'failed to ignore update correctly, should be 5, actually ' + node.depth)
      })
    })

    describe('remove(suffix)', function(){
      before(function(){
        node = new NameTree.Node(new ndn.Name(""))
        node.insert(new NameTree.Node(new ndn.Name("0/1/2/3/4")))
        node.insert(new NameTree.Node(new ndn.Name("1/1/2")))
        node.insert(new NameTree.Node(new ndn.Name("2/1/2/3/4/5/")))
        node.insert(new NameTree.Node(new ndn.Name("3")))
        node.children[0].updateDepth(4);
        node.children[1].updateDepth(2);
        node.children[2].updateDepth(5);
        node.children[3].updateDepth(0);

        assert(node.depth === 6, "failed sanity depth check after inserts")
      })

      it('should return null for non-existent child',function(){
        var removed = node.remove(new ndn.Name.Component("4"))
        assert(removed === null, "returned something: " + removed)
      })

      it('should return correct removal', function(){
        var removed = node.remove(new ndn.Name.Component('2'))
        assert(removed.prefix.equals(new ndn.Name("2")), 'removed the wrong node')
      })

      it('should update depth appropriately', function(){
        assert(node.depth === 5, 'failed to update after removing deepest child')

        node.remove(new ndn.Name.Component("1"))
        assert(node.depth === 5, 'updated incorrectly after removing non-deepest child')

        node.remove(new ndn.Name.Component("0"))
        assert(node.depth === 1, 'failed to update after removing next deepest child')

        node.remove(new ndn.Name.Component('3'))
        assert(node.depth === 0, 'failed to update after last node removed')
      })
    });

    describe('_reverse()', function(){
      node = new NameTree.Node(new ndn.Name(""))
      before(function(){
        assert(node._traversal_direction === NameTree.TRAVERSE_LEFT, "_traversal_direction should be NameTree.TRAVERSE_LEFT (0) by default")
      })
      it('should set node._traversal_direction = NameTree.TRAVERSE_RIGHT', function(){
        node._reverse()
        assert(node._traversal_direction === NameTree.TRAVERSE_RIGHT, "_traversal_direction should be NameTree.TRAVERSE_RIGHT (1) after _reverse()")
      })
    });

    describe('Symbol.iterator', function(){
      before(function(){
        node = new NameTree.Node(new ndn.Name(""))
        node.insert(new NameTree.Node(new ndn.Name("0/1/2/3/4")))
        node.insert(new NameTree.Node(new ndn.Name("1/1/2")))
        node.insert(new NameTree.Node(new ndn.Name("2/1/2/3/4/5/")))
        node.insert(new NameTree.Node(new ndn.Name("3")))
        node.children[0].updateDepth(4);
        node.children[1].updateDepth(2);
        node.children[2].updateDepth(5);
        node.children[3].updateDepth(0);
      })

      it('should work in for...of loop', function(){
        var i = 0
        for (var child of node){
          i++;
          assert(child,"not iterating" )
        }
      })

      it('should iterate left to right by default', function(){
        var i = 0
        for (var child of node){

          assert(child.equals(node.children[i]),"not iterating correctly" )
          i++;
        }
      })

      it('should iterate right to ONCE after _reverse()', function(){
        node._reverse()
        var i = node.children.length - 1
        for (var child of node){

          assert(child.equals(node.children[i]),"not iterating right to left correctly" )
          i--;
        }

        for (var child of node){
          i++;
          assert(child.equals(node.children[i]),"not reseting iterator correctly" )

        }
      })
    });

  });

  describe('constructor', function(){
    var tree;
    before(function(){
      tree = new NameTree();
    })

    it('should have root node with zero prefix', function(){
      assert(tree.root.equals(new NameTree.Node(new ndn.Name(""))), 'root is not what we expect: ' + this.root);
    })
  });

  describe('insert(node)', function(){
    var tree;
    before(function(){
      tree = new NameTree();
      for (var i = 0; i < 10; i++)
        for (var j = 0 ; j < 10; j++)
          for (var k = 0 ; k < 10; k++)
            tree.insert(new NameTree.Node(new ndn.Name([''+i,''+j,''+k])))

    })

    it('should reflect correct depth in root',function(){
      assert(tree.root.depth === 3, 'bootstrap depth is wrong')


      tree.insert(new NameTree.Node(new ndn.Name([''+10,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+10])))

      assert(tree.root.depth === 10, 'did not update depth appropriately')
    })

    it('should insert all ancestors', function(){
      var child = tree.root.children[10]
      var name = new ndn.Name([''+10,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+10])
      for (var i = 0; i < 10; i++){
          assert(child.equals(new NameTree.Node(name.getPrefix(i+1))), 'actual: ' +child.prefix.toUri() + ' \n expected: ' + name.getPrefix(i+1).toUri()  )
          child = child.children[0]
      }
    })

    it('should update depth for all created ancestors', function(){
      var child = tree.root.children[10]
      for (var i = 1; i < 10; i++){
          assert(child.depth === 10 - i,' \n prefix:' + child.prefix.toUri() + ' \n actual: ' +child.depth + ' \n expected: ' + 1  )
          child = child.children[0]
      }
    })

    it('should update depth for common and created ancestors ONLY', function(){
      var prefix = new ndn.Name([''+10,''+2,''+3,''+4,''+5,''+16,''+17,''+18,''+19,''+110, ''+111,''+112,''+113])
      tree.insert(new NameTree.Node(prefix))

      assert(tree.root.depth === 13, 'root depth not updated correctly \n actual:' + tree.root.depth + '\n expected: '+ 13);

      var child = tree.root.children[10];
      for (var i = 1; i < 5;i++)
      {
        var expected  = 13 -i;
        assert(child.depth === expected,'ancestor depth not updated correctly \n prefix:' + child.prefix.toUri() + ' \n actual: ' +child.depth + ' \n expected: ' + expected   )
        child = child.children[0];
      }
      var psuedoRoot = child;

      for(var j = 6; j <= 10; j++){
        child = child.children[0];
        assert(child.depth === 10 - j,'ancestor depth not maintained correctly \n prefix:' + child.prefix.toUri() + ' \n actual: ' +child.depth + ' \n expected: ' + expected   )

      }
      var child = psuedoRoot.children[1];
      for(var j = 6; j <= 13; j++){
        assert(child.depth === 13 - j,'ancestor depth not updated correctly \n prefix:' + child.prefix.toUri() + ' \n actual: ' +child.depth + ' \n expected: ' + expected   )
        child = child.children[0];
      }

      assert(tree.root.children[0].depth === 2, 'short depth not maintained correctly')

    })

  });

  describe('remove(prefix)',function(){
    var tree;
    before(function(){
      tree = new NameTree();
      for (var i = 1; i <= 10; i++)
        for (var j = 1 ; j <= 10; j++)
          for (var k = 1 ; k <= 10; k++)
            tree.insert(new NameTree.Node(new ndn.Name([''+i,''+j,''+k])))

      tree.insert(new NameTree.Node(new ndn.Name([''+0,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+10]), {item:true}));

      tree.insert(new NameTree.Node(new ndn.Name([''+0,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+11])));

      tree.insert(new NameTree.Node(new ndn.Name([''+0,''+2,''+3,''+5]),  {item:true}))
    })

    it('should return null for node with no item',function(){
      assert(!tree.remove(new ndn.Name([''+0,''+2,''+3,''+4])), 'returned something for a node with no item');
    })

    it('should return the item, and remove the item', function(){
      var item = tree.remove(new ndn.Name([''+0,''+2,''+3,''+5]))
      assert(item, 'returned nothing for a node with an item')

      assert(!tree.remove(new ndn.Name([''+0,''+2,''+3,''+5])), 'returned something for a node with no item')
    })

    it('should actualy remove the node ONLY if it is a terminal node', function(){
      tree.remove(new ndn.Name([''+1,''+1]))
      assert(tree.root.children[1].children[0], "node doesn't exist")

      tree.remove(new ndn.Name([''+0,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+10]))

      tree.insert(new NameTree.Node(new ndn.Name([''+0,''+0,''+0,''+0,''+0]), {item:true}));
      assert(tree.remove(new ndn.Name([''+0,''+0,''+0,''+0,''+0])).item,'did not return item?')
      assert(!tree.root.children[0].children[0].children[0].children[0].children[0].prefix.equals(new ndn.Name([''+0,''+0,''+0,''+0,''+0])))

    })

    it('should remove all empty ancestors', function(){

      tree.insert(new NameTree.Node(new ndn.Name([''+0,''+0,''+0,''+0,''+0]), {item:true}));
      assert(tree.remove(new ndn.Name([''+0,''+0,''+0,''+0,''+0])).item,'did not return item?')
      tree.remove(new ndn.Name([''+0,''+0,''+0,''+0,''+0]))

      var msg = "did not remove ancestor"
      assert(!tree.root.children[0].children[0].children[0].children[0].children[0].prefix.equals(new ndn.Name([''+0,''+0,''+0,''+0,''+0])), msg)
      assert(!tree.root.children[0].children[0].children[0].children[0].prefix.equals(new ndn.Name([''+0,''+0,''+0,''+0])), msg)
      assert(!tree.root.children[0].children[0].children[0].prefix.equals(new ndn.Name([''+0,''+0,''+0])),msg)
      assert(!tree.root.children[0].children[0].prefix.equals(new ndn.Name([''+0,''+0])),msg)
      assert(tree.root.children[0].prefix.equals(new ndn.Name([''+0])), 'removed ancestor when not supposed to')

    })

    it('should update depth appropriately', function(){

      tree.remove(new ndn.Name([''+0,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+11]))

      tree.remove(new ndn.Name([''+0,''+2,''+3,''+4,''+5,''+6,''+7,''+8,''+9,''+10]))
      assert(tree.root.depth === 3, tree.root.depth)
      assert(tree.root.children[0].depth === 2, tree.root.children[0].depth )
    })
  });

  describe('get(prefix)',function(){

    var tree = new NameTree()
    it('should always return a matching node',function(){
      for(var i = 0; i < 20;i++)
        for(var j = 0; j < 20;j++)
          for(var k = 0; k < 20;k++)
            assert(tree.get(new ndn.Name([""+i,''+j,""+k])))
    })

    it('should return a node with an item', function(){
      tree.insert(new NameTree.Node(new ndn.Name("1/2/7/someRandom/stuff"), {$item:true}),"error!");

      assert(tree.get(new ndn.Name("1/2/7/someRandom/stuff")).item.$item)
    })

  });

  describe('Symbol.iterator',function(){
    var tree, nodes;
    before(function(){
      tree = new NameTree();
        for(var i = 0; i < 10;i++)
          for(var j = 0; j < 10;j++)
            for(var k = 0; k < 10;k++)
              tree.insert(new NameTree.Node(new ndn.Name([""+i,''+j,""+k])));

    })

    it('should throw an error if not configured', function(done){
      try{
        for (var node of tree)
          console.log('ERR!!!')
      }catch(e){
        assert(e);
        done();
      }
    })

    describe('up(prefix)',function(){
      it('should iterate up', function(){
        var name = new ndn.Name("1/1/1/1");
        tree.up(name.getPrefix(-1));
        var i = 0;
        for(var node of tree)
          assert(node.prefix.equals(name.getPrefix(--i)), node.prefix.toUri() + " " + name.getPrefix(i).toUri())
      })
    })

    describe('left(prefix)',function(){
      it('should iterate left(down)', function(){
        tree.left();
        var i = 0;
        for(var node of tree){
          if (i === 0)
            assert(node.prefix.equals(new ndn.Name("")))
          if (i === 1)
            assert(node.prefix.equals(new ndn.Name("0")))
          if (i === 2)
            assert(node.prefix.equals(new ndn.Name("0/0")))
          if (i === 3)
            assert(node.prefix.equals(new ndn.Name("0/0/0")))
          if (i === 4)
            assert(node.prefix.equals(new ndn.Name("0/0/1")))
          i++;
        }
        assert(i === 1111, 'if this is first err' + i)
      })
    })

    describe('right(prefix)',function(){
      it('should iterate right(down)', function(){
        tree.right();
        var i = 0;

        for(var node of tree){
          if (i === 0)
            assert(node.prefix.equals(new ndn.Name("")))
          if (i === 1)
            assert(node.prefix.equals(new ndn.Name("9")))
          if (i === 2)
            assert(node.prefix.equals(new ndn.Name("9/9")))
          if (i === 3)
            assert(node.prefix.equals(new ndn.Name("9/9/9")))
          if (i === 4)
            assert(node.prefix.equals(new ndn.Name("9/9/8")))
          i++;
        }
        assert(i === 1111, 'if this is first err' + i)
      })
    })

    describe('skip(function)',function(){
      it('should skip over upwards iteration',function(){
        tree.up(new ndn.Name("1/2/3"))
        function skip(node){
          if (node.prefix.equals(new ndn.Name("1/2")))
            return true;
          else
            return false;
        }
        tree.skip(skip);

        var i = 0
        for(var node of tree){
          i++;
          assert(!node.prefix.equals(new ndn.Name("1/2")))
        }
        assert(i === 3)

      })

      it('should skip entire branch down based on name', function(){
        tree.left()

        function skip(node){
          if (node.prefix.getPrefix(1).equals(new ndn.Name("0")))
            return true
        }

        tree.skip(skip)
        var i = 0;
        for(var node of tree){
          //console.log(node.prefix.toUri())
          if (i === 0)
            assert(node.prefix.equals(new ndn.Name("")))
          if (i === 1)
            assert(node.prefix.equals(new ndn.Name("1")))
          if (i === 2)
            assert(node.prefix.equals(new ndn.Name("1/0")))
          if (i === 3)
            assert(node.prefix.equals(new ndn.Name("1/0/0")))
          if (i === 4)
            assert(node.prefix.equals(new ndn.Name("1/0/1")))
          i++;
        }
        assert(i === 1000, 'if this is first err' + i)

      })
    })


  });
})
