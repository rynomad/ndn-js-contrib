var treeNode = require("./NameTreeNode.js")
  , binaryIndexOf = require("./binarySearch.js")
  , ndn
  , NameTree = function(){};

NameTree.useNDN = function(NDN){
  node.useNDN(NDN);
  ndn = NDN;
}

/**
 * Add a node to the NameTree, recursively populating all parents
 * @param  {Name|String} prefix - the prefix for the new node.
 * @returns {NameTreeNode} node - the NameTree node created.
 */
NameTree.prototype.addNode = function(prefix, child, final){
  if (typeof prefix == "string")
    prefix = new ndn.Name(prefix);

  var self = this[prefix.toUri()];

  if (self){
    if (child)
      self.addChild(child);
    if (final)
      return final;
    else
      return this; //node exists
  } else {
    self = new node(prefix, this);
    if (child)
      self.addChild(child);
    if (prefix.size() > 0)
      if (final)
        return this.addNode(prefix.getPrefix(-1), self, final);
      else
        return this.addNode(prefix.getPrefix(-1), self, self)
  }
}

/**
 * Delete a node (and all it's children, grandchildren, etc.).
 * @param   {Name|URI} prefix - the name of the node to delete.
 * @returns {NameTree} the nameTre e.
 */
NameTree.prototype.removeNode = function(prefix, cycleFinish){
  if (typeof prefix == "string")
    prefix = new ndn.Name(prefix)

  cycleFinish = cycleFinish || prefix;
  var self = this[prefix.toUri()];

  if (!self)
    return this;
  else{
    var child = self.children.shift();

    if (child !== undefined){
      return this.removeNode(child.prefix, cycleFinish);
    } else {
      delete this[self.prefix.toUri()];
      if (cycleFinish.match(prefix))
        this[self.parent].removeChild(prefix.get(-1))
        return this;
      else
        return this.removeNode(prefix.getPrefix(-1), cycleFinish);
    }
  }
}

/**
 * Perform a lookup on the NameTree and return the proper node, creating it if necessary.
 * @prefix  {Name|URI} the name of the node to lookup.
 * @returns {NameTreeNode} the resulting node.
 */
NameTree.prototype.lookup = function (prefix) {
  if (typeof prefix == "string")
    prefix = new ndn.Name(prefix);
  var node = this[prefix.toUri()];

  (node) ?
    return node;
  : return (this.addNode(prefix))
}

/**
 * Find the Longest Prefix Match in the NameTree that matches the selector
 * @prefix   {Name|URI} the name to lookup
 * @selector {function} selector function returning boolean if the node fulfills requirements
 * @returns  {NameTreeNode} the longest prefix match.
 */
NameTree.prototype.findLongestPrefixMatch = function(prefix, selector) {
  if (typeof prefix == "string")
    prefix = new ndn.Name(prefix);

  var match = this[prefix.toUri()]
  if ( match && selector(match))
    return match;
  else if (prefix.size() > 0)
    return this.findLongestPrefixMatch(prefix.getPrefix(-1), selector)
  else
    return null
}

/**
 * Return an Iterator that provides a .next() method which returns the next longest Prefix matching the selector, returning null when depleted.
 * @param {Name} prefix - the prefix to begin iteration
 * @param {Function} selector - a selector function that returns a boolean when called with selector(node)
 * @returns {Object} Iterator - the .depleted property of the iterator will be true when there are no more matches.
 */
NameTree.prototype.findAllMatches = function(prefix, selector){
  if (typeof prefix == "string")
    prefix = new ndn.Name(prefix);

  var self = this
    , nextReturn = self[prefix.toUri()]
    , thisReturn
    , iterator = {
      next: function(){
        if (this.depleted)
          return null;
        prefix = nextReturn.prefix;
        thisReturn = nextReturn;
        nextReturn = (thisReturn && selector(thisReturn.parent)) ?
          thisReturn.parent
        : (prefix.size() > 0) ?
          self.findLongestPrefixMatch(prefix, selector)
        : null ;
        if (!nextReturn)
          this.depleted = true

        return thisReturn;
      }
    }

  if (nextReturn && selector(nextReturn)){
    iterator.depleted == false;
    return iterator;
  };
  if (prefix.size() > 0)
    return this.findAllMatches(prefix.getPrefix(-1), selector);
  else
    return null;
}

module.exports = NameTree;
