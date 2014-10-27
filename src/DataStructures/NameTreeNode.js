var binarySearch = require("./../Utility/binarySearch.js")
  , ndn;

/**NameTreeNode constructor, NOTE: (typeof URI == "string") && (Name instanceof <a href="https://github.com/named-data/ndn-js/blob/master/js/name.js">ndn.Name</a> )
 *@constructor
 *@private
 *@param {Name|URI} prefix of the node
 *@returns {NameTreeNode}
 */
var NameTreeNode = function NameTreeNode (prefix) {
  this.prefix     = (typeof prefix === "string") ? new ndn.Name(prefix) : (prefix || null);
  this.parent     = null;
  this.children   = [];
  this.fibEntry   = null;
  this.pitEntries = [];
  this.measurements  = null;
  this.strategy = null;
  return this;
};

/**Install ndn-lib. Only necessary if you're using require("ndn-Classes/src/DataStructures/NameTreeNode.js"), done for you if require("ndn-Classes").NameTree.Node
 *@private
 *@param {Object} NDN ndn-lib object
 */
NameTreeNode.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

/**Add a child node to this one, inserting at the properly sorted index according to canonical namespace rules
 *@private
 *@param {NameTreeNode | String} child - the node to insert, or the suffix for a new node.
 *@returns {NameTreeNode} the original node
 */
NameTreeNode.prototype.addChild = function addChild(child){
  var self  = this
    , index = binarySearch(this.children, child.prefix.get(-1), "prefix");

  child = (child.prefix) ? child : new NameTreeNode(new ndn.Name(self.prefix).append(child));
  if ( index < 0){
    this.children.splice(~index, 0, child);
  }
  return this;
};

/**Remove a child from this node. This won't derefrence the child node, just remove it from the index
 *@private
 *@param {NameTreeNode | String} child - the node to remove, or the suffix of that node.
 *@returns {NameTreeNode} the original node
 */
NameTreeNode.prototype.removeChild = function(child){
  child = (typeof child === "string") ? {prefix:  new ndn.Name(child)} : child;

  var index = binarySearch(this.children, child.prefix.get(-1), "prefix");
  if (index < 0){
    return this;
  } else {
    this.children.splice(index, 1);
    return this;
  }
};


module.exports = NameTreeNode;
