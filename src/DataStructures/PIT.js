

var NameTree = require("./NameTree.js");
var crypto = require("ndn-js/js/crypto.js");

function PIT(){
  this._nameTree = new NameTree()
}

PIT.prototype.insert = function PIT_insert(interest, onData){
  var self = this;
  return new Promise(function PIT_insert_Promise(resolve,reject){
    var nameTreeNode = self._nameTree.get(interest.name)
    if (!nameTreeNode.getItem())
      nameTreeNode.setItem(new PIT.Node())

    var pitNode = nameTreeNode.getItem();
    if (pitNode.addEntry(interest, onData ))
      resolve(interest)
    else
      reject(new Error("PIT.insert(interest, onData): interest is duplicate"));
  });
};

PIT.prototype.lookup = function PIT_lookup(data){
  var self = this;
  return new Promise(function PIT_lookup_Promise(resolve,reject){
    var nameWithDigest = data.name.getPrefix(data.name.size())


    nameWithDigest.append("sha256digest=" + crypto.createHash('sha256')
                                                  .update(data.wireEncode()
                                                              .buffer)
                                                  .digest()
                                                  .toString('hex'));

    self._nameTree.up(nameWithDigest)
    self._nameTree.skip(function(node){
      return (!node.getItem());
    })

    var results = [];

    for(var ntnode of self._nameTree){
      var pitNode = ntnode.getItem()
      for(var entry in pitNode._entries){
        if (pitNode._entries[entry].interest.matchesName(data.name)){

          var ent = pitNode._entries.splice(entry, 1)[0];
          clearTimeout(ent.timeID);
          
          var inface = ent.onData(data);

          if (inface){
            var dup = false;
            for (var face in results){
              if (results[face] === inface){
                dup = true;
                break;
              }
            }
            if (!dup)
              results.push(inface);
          }
        }
      }
      if (!pitNode._entries)
        self._nameTree.remove(ntnode.prefix)
    }

    if (results.length > 0)
      resolve(results);
    else
      reject(new Error("PIT.lookup(data): no outbound pitentries for that data"));
  });
};

PIT.Node = function PIT_Node(){
  this._entries = [];
};

PIT.Node.prototype.timeout = function PIT_Node_timeout(interest){
  for (var index in this._entries)
    if (this._entries[index].interest.getNonce().equals(interest.getNonce()))
      return this._entries.splice(index, 1);
}

PIT.Node.prototype.addEntry = function PIT_Node_addEntry(interest, onData){
  var self = this;
  for (var entry of this._entries)
    if (entry.interest.getNonce().equals(interest.getNonce()))
      return false;

  this._entries.push({
    interest: interest
    , onData: onData
    , timeID: setTimeout(function PIT_Node_entry_timeout(){
        self.timeout(interest);
      }, interest.getInterestLifetimeMilliseconds())
  });
  return true;
}





/**Pending Interest Table
 *@constructor
 *@param {NameTree} nameTree the nameTree to build the table on top of
 *@returns {PIT} a new PIT
 */



module.exports = PIT;
