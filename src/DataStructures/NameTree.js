var NameTreeNode = require("./NameTreeNode.js")
  , binaryIndexOf = require("./../Utility/binarySearch.js")
  , ndn
  , debug = require("./../Utility/debug.js").NameTree;

/**Creates an empty NameTree.
 *@constructor
 */
var NameTree = function NameTree (){
  this.addNode('/');
  return this;
};

NameTree.Node = NameTreeNode;


/**Install ndn-lib. Only necessary if you're using require("ndn-Classes/src/DataStructures/NameTree.js"), done for you if require("ndn-Classes").NameTree
 *@private
 *@param {Object} NDN ndn-lib object
 */
NameTree.installNDN = function(NDN){
  NameTree.Node.installNDN(NDN);
  ndn = NDN;
  return this;
};

/**
 * Add a node to the NameTree, recursively populating all parents
 * @param  {Name|String} prefix - the prefix for the new node.
 * @returns {NameTreeNode} node - the NameTree node created.
 */
NameTree.prototype.addNode = function(prefix){
  if (typeof prefix === "string"){
    prefix = new ndn.Name(prefix);
  }
  var self = this[prefix.toUri()];
  if(self){
    return self;
  } else {
    self = this[prefix.toUri()] = new NameTree.Node(prefix);
    while(prefix.size() > 0){
      var parentPrefix = prefix.getPrefix(-1);

      if(!this[parentPrefix.toUri()]){
        this[parentPrefix.toUri()] = new NameTree.Node(parentPrefix);
      }
      this[prefix.toUri()].parent = this[parentPrefix.toUri()];
      this[parentPrefix.toUri()].addChild(this[prefix.toUri()]);
      prefix = parentPrefix;
    }
  }
  return self;
};

/**
 * Delete a node (and all it's children, grandchildren, etc.).
 * @param   {Name|URI} prefix - the name of the node to delete.
 * @returns {NameTree} the nameTree.
 */
NameTree.prototype.removeNode = function(prefix, cycleFinish){
  if (typeof prefix === "string"){
    prefix = new ndn.Name(prefix);
  }
  cycleFinish = cycleFinish || prefix;
  var self = this[prefix.toUri()];

  if (!self){
    return this;
  } else{
    var child = self.children.shift();

    if (child !== undefined){
      return this.removeNode(child.prefix, cycleFinish);
    } else {
      delete this[self.prefix.toUri()];
      if (cycleFinish.equals(prefix)){
        self.parent.removeChild(self);
        return this;
      }
      else{
        return this.removeNode(prefix.getPrefix(-1), cycleFinish);
      }
    }
  }
};

/**
 * Perform a lookup on the NameTree and return the proper node, creating it if necessary.
 * @param  {Name|URI} prefix the name of the node to lookup.
 * @returns {NameTreeNode} the resulting node.
 */
NameTree.prototype.lookup = function (prefix) {
  if (typeof prefix === "string"){
    prefix = new ndn.Name(prefix);
  }
  var node = this[prefix.toUri()];

  if (node){
    return node;
  } else{
    return (this.addNode(prefix));
  }
};

/**
 * Find the Longest Prefix Match in the NameTree that matches the selector
 * @param    {Name|URI} prefix the name to lookup
 * @param    {function} selector predicate function
 * @returns  {NameTreeNode} the longest prefix match.
 */
NameTree.prototype.findLongestPrefixMatch = function(prefix, selector) {
  if (typeof prefix === "string"){
    prefix = new ndn.Name(prefix);
  }
  selector = selector || function(){return true;};

  var match = this[prefix.toUri()];
  if ( match && selector(match)){
    return match;
  } else if (prefix.size() > 0){
    return this.findLongestPrefixMatch(prefix.getPrefix(-1), selector);
  } else {
    return null;
  }
};

/**
 * Return an Iterator that provides a .next() method which returns the next longest Prefix matching the selector, returning null when depleted.
 * @param {Name} prefix - the prefix to begin iteration
 * @param {Function} selector - a selector function that returns a boolean when called with selector(node)
 * @returns {Object} Iterator - the .depleted property of the iterator will be true when there are no more matches.
 */
NameTree.prototype.findAllMatches = function(prefix, selector){
  if (typeof prefix === "string"){
    prefix = new ndn.Name(prefix);
  }
  selector = selector || function(){return true;};

  var self = this
    , nextReturn = self[prefix.toUri()]
    , thisReturn
    , iterator = {
      next: function(){
        if (!this.hasNext){
          return null;
        }
        prefix = nextReturn.prefix;
        thisReturn = nextReturn;
        nextReturn = (thisReturn && thisReturn.parent && selector(thisReturn.parent)) ?
          thisReturn.parent
        : (prefix.size() > 0) ?
          self.findLongestPrefixMatch(prefix.getPrefix(-1), selector)
        : null ;
        if (!nextReturn){
          this.hasNext = false;
        } else {
          this.hasNext = true;
        }
        return thisReturn;
      }
    };

  if (nextReturn && selector(nextReturn)){
    iterator.hasNext = true;
    return iterator;
  } else if (prefix.size() > 0){
    return this.findAllMatches(prefix.getPrefix(-1), selector);
  } else{
    return null;
  }
};

module.exports = NameTree;
