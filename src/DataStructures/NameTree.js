var Name = require('ndn-js/js/name.js').Name;

function checkNode(functionName, node){
  if (!(node && node._isNTN))
    throw new Error(functionName + ": invalid argument, requires a NameTreeNode");
}

/**Creates an empty NameTree.
 *@constructor
 */
var NameTree = function NameTree (){
  this.root = new NameTree.Node(new Name(""));

  var self = this;
  this[Symbol.iterator] = function NameTree_Iterator(){
    var iter;

    if (self._traversal_direction + 1 === 0){
      throw new Error("NameTree[Symbol.iterator](): must use NameTree.up(prefix)/.left(prefix)/.right(prefix) to set traversal direction");
    } else if (self._traversal_direction === NameTree.TRAVERSE_UP){
      iter = new Prefix_Iterator(self, self._traversal_prefix, self._skipper());
    } else {
      console.log("suffiter")
      iter = new Suffix_Iterator(self, self._traversal_prefix, self._traversal_direction, this._skipper());
    }

    self._traversal_direction = -1;
    self._traversal_prefix = null;

    return iter;
  };

  return this;
};

NameTree.TRAVERSE_LEFT  = 0;
NameTree.TRAVERSE_RIGHT = 1;
NameTree.TRAVERSE_UP    = 2;

module.exports = NameTree;

/**
 * Add a node to the NameTree, recursively populating all parents
 * @param  {NameTree.Node} node - the NameTree.Node to insert.
 * @returns {NameTree} this - the NameTree (for chaining).
 */
NameTree.prototype.insert = function NameTree_insert(node){
  var curr = this.root;

  while (!curr.equals(node)){
    curr = curr.insert(node);
  }

  curr.insert(node);

  return this;
};

/**
 * remove a node (if no children) and its ancestors (if empty).
 * @param   {Name} prefix - the name of the node to delete.
 * @returns {Object} any item attatched to the node of that prefix
 */
NameTree.prototype.remove = function NameTree_remove(prefix){
  this.up(prefix);
  var first = true
    , item  = null
    , removeSuffix;

  for (var node of this){
    if (first){
      item = node.getItem();
      node.setItem(null);
    }

    first = false;

    if (removeSuffix)
      node.remove(removeSuffix);


    removeSuffix = false;

    if (node.isEmpty())
      removeSuffix = node.prefix.get(-1);
    else {
      node.updateDepth(~(prefix.size() - node.prefix.size()));
    }
  }

  if (removeSuffix)
    this.root.remove(removeSuffix);
  else
    this.root.updateDepth(~prefix.size())
  return item;
};

/**
 * Perform a lookup on the NameTree and return the proper node, creating it if necessary.
 * @param  {Name|URI} prefix the name of the node to lookup.
 * @returns {NameTreeNode} the resulting node.
 */
NameTree.prototype.get = function NameTree_get(prefix) {
  var node = new NameTree.Node(prefix);

  var curr = this.root;

  while (!curr.equals(node)){
    curr = curr.insert(node);
  }
  node = curr;

  return node;
};

function Iterator_Node (node, next){
  this.node = node;
  this.next = next || null;
}


function Prefix_Iterator(nameTree, prefix, skip){
  var node = new NameTree.Node(prefix);
  var curr = nameTree.root;

  this.head = new Iterator_Node(curr);
  while (!curr.equals(node)){
    var next = curr.insert(node);
    this.head = (!skip(next)) ? new Iterator_Node(next, this.head) : this.head;

    curr = next;
  }


}

Prefix_Iterator.prototype.next = function NameTree_Iterator_next (){
  var next = this.head.node;
  this.head = this.head.next;
  return {
    done: !this.head
    , value: next
  };
};


/**
 * Return an Iterator that provides a .next() method which returns the next longest Prefix matching the selector, returning null when depleted.
 * @param {Name} prefix - the prefix to begin iteration
 * @param {Function} selector - a selector function that returns a boolean when called with selector(node)
 * @returns {Object} Iterator - the .depleted property of the iterator will be true when there are no more matches.
 */


function Suffix_Iterator(nameTree, prefix, _reverse, skip){
  this._stack = [];
  this._reverse = _reverse;

  this._node = (_reverse) ?
               nameTree.get(prefix)._reverse()[Symbol.iterator]()
             : nameTree.get(prefix)[Symbol.iterator]();

  this._node.skip(skip);

  return this;
}

Suffix_Iterator.prototype.next = function Suffix_Iterator_next(){
  var node = this._node.next();

  if (this._stack.length || !node.done){
    if (!node.done){
      this._stack.push(this._node);
      this._node = (this._reverse) ?
                   node.value._reverse()[Symbol.iterator]()
                 : node.value[Symbol.iterator]();
    } else {
      while (this._stack.length && node.done){
        this._node = this._stack.pop();
        node = this._node.next();
      }
    }
  }

  return node;
};


/**
 *
 *@param {Function} skip     - a predicate that returns true if you want to skip a node, default returns false (ie all nodes on the walk are returned)
 */
NameTree.prototype.skip  = function NameTree_skip(skip){
  var self = this;
  this._skipper = function skip(){
    self._skipper = NameTree.prototype._skipper;
    return skip;
  };
};

NameTree.prototype._skipper = function NameTree__skipper(){
  return function skip(){
    return false;
  };
};


/**
 * configure the *next* constructed iterator to traverse UP, starting from a given node resolving at the root
 * @param {Name}     prefix   - the prefix of the node to begin iterating at.
 * @param {Function} skip     - a predicate that returns true if you want to skip a node, default returns false (ie all nodes on the walk are returned)
 */
NameTree.prototype.up    = function NameTree_up(prefix, skip){
  this._traversal_direction = NameTree.TRAVERSE_UP;
  this._traversal_prefix    = prefix || this.head;
};

/**
 * configure the *next* constructed iterator to traverse left(down), starting from a given node resolving at the
 * rightmost child. the skip parameter allows you to skip ENTIRE BRANCHES of the tree. if you want to just hop over
 * nodes, do it manually in your loop body.
 * @param {Name}     prefix   - the prefix of the node to begin iterating at.
 */
NameTree.prototype.left  = function NameTree_left(prefix){
  this._traversal_direction = NameTree.TRAVERSE_LEFT;
  this._traversal_prefix    = prefix || this.root;
};


/**
 * configure the *next* constructed iterator to traverse right(down), starting from a given node resolving at the
 * LEFTmost child. the skip parameter allows you to skip ENTIRE BRANCHES of the tree. if you want to just hop over
 * nodes, do it manually in your loop body.
 * @param {Name} prefix - the prefix of the node to begin iterating at.
 */
NameTree.prototype.right = function NameTree_right(prefix){
  this._traversal_direction = NameTree.TRAVERSE_Right;
  this._traversal_prefix    = prefix || this.root;
};

NameTree.prototype._traversal_direction = -1;
NameTree.prototype._traversal_start     = null;

NameTree.Node = function NameTree_Node(prefix, item) {
  this.item = item;
  this.children = [];
  this.prefix = prefix;
  this.depth = 0;

  this[Symbol.iterator] = function NameTree_Node_Iterator(){
    var iter = new Child_Iterator(this, this._traversal_direction, this._skipper);

    this._traversal_direction = NameTree.TRAVERSE_LEFT;
    return iter;
  };

  return this;
};

NameTree.Node.prototype.depth    = function NameTree_Node_depth (){
  return this.depth;
};

NameTree.Node.prototype.skip     = NameTree.prototype.skip;

NameTree.Node.prototype._skipper = NameTree.prototype._skipper;

NameTree.Node.prototype.equals   = function NameTree_Node_equals (node){
  return this.prefix.equals(node.prefix);
};

NameTree.Node.prototype.getItem  = function NameTree_Node_getItem (){
  return this.item;
}

NameTree.Node.prototype.setItem  = function NameTree_Node_setItem (item){
  this.item = item;
}

NameTree.Node.prototype.indexOf  = function NameTree_Node_indexOf (suffix){
  var min = 0
    , max = this.children.length - 1
    , guess
    , comparison;

  while (min <= max) {
    guess = Math.floor((min + max) / 2);
    if (this.children[guess].prefix.get(-1).equals(suffix)) {
      return guess;
    } else {
      comparison = this.children[guess].prefix.get(-1).compare(suffix);

      if (comparison < 0) {
        min = ++guess;
      } else {
        max = --guess;
      }
    }
  }

  return ~(max + 1);
};

NameTree.Node.prototype.insert  = function NameTree_Node_insert (node){
  if (this.equals(node)){
    if (this.item && node.item)
      throw new Exception("NameTree.Node.insert: Already have that node with an Item");
    else if (!this.item && node.item){
      this.setItem(node.item)
    }
    return this;
  }

  var suffix = node.prefix.get(this.prefix.size())
    , childIndex = this.indexOf(suffix)
    , insertion;

  if (childIndex < 0){
    childIndex = ~childIndex;
    insertion = new NameTree.Node(node.prefix.getPrefix(this.prefix.size() + 1));
    this.children.splice(childIndex, 0, insertion);
  } else {
    insertion = this.children[childIndex];
  }

  this.updateDepth(node.prefix.size() - this.prefix.size());

  return insertion;
};

NameTree.Node.prototype.updateDepth = function NameTree_Node_updateDepth (depth){
  this.depth = (depth && depth > this.depth) ?
               depth
             : (depth) ?
               this.depth
             : (this.children.length === 0) ?
               0
             : Math.max.apply(null,this.children.map(function(child){return child.depth;})) + 1;
};

NameTree.Node.prototype.remove = function NameTree_Node_remove (suffix){
  var childIndex = this.indexOf(suffix)
    , node;

  if (childIndex < 0){
    node = null;
  } else {
    node = this.children.splice(childIndex, 1)[0];
  }

  this.updateDepth();

  return node;
};

NameTree.Node.prototype._reverse = function NameTree_Node__reverse(){
  this._traversal_direction = NameTree.TRAVERSE_RIGHT;
};

NameTree.Node.prototype.isEmpty = function NameTree_Node_isEmpty (){
  return (!this.children.length && !this.item);
};

NameTree.Node.prototype._traversal_direction = NameTree.TRAVERSE_LEFT;


function Child_Iterator (node, direction, skip){
  this.direction = direction;
  this.children  = node.children.slice(0);
  this.skip      = skip;
}

Child_Iterator.prototype.next = function(){
  var next;

  do {
    next = (!this.direction) ?
              this.children.shift()
            : this.children.pop();
  } while (next && this.skip(next));

  return {
    done: (!next && !this.children.length) ? true : false
    , value : next
  };
};
