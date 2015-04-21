var NameTree = require("./NameTree.js")
  , Name = require("ndn-js/js/name.js").Name;

function Strategy (){
  this._nameTree = new NameTree();
  this._nameTree.insert(new NameTree.Node(new Name(), new Strategy.Default()));
  return this;
}

Strategy.Default = function Strategy_default(){
  return this;
}

Strategy.Default.prototype.choose = function Strategy_Default_choose(nexthops){
  return nexthops;
}

Strategy.Default.prototype.log = function Strategy_Default_log(nexthops, response){
  return;
}

Strategy.prototype.insert = function Strategy_insert(prefix, strategy){
  this._nameTree.get(prefix).setItem(strategy);
}

Strategy.prototype.lookup = function Strategy_lookup(interest){
  this._nameTree.up(interest.name)
  var self = this;
  this._nameTree.skip(function(node){
    if (node.isEmpty()){
      return true;
    } else {
      return false;
    }
  })


  for (var node of this._nameTree)
    return node.getItem();
}

module.exports = Strategy;
