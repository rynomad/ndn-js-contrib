

var NameTree = require("./NameTree.js");
var crypto = require("ndn-js/js/crypto.js");

function PIT(){
  this._nameTree = new NameTree();
}

PIT.prototype.insert = function PIT_insert(interest, face){
  var self = this;
  return new Promise(function PIT_insert_Promise(resolve,reject){
    var nameTreeNode = self._nameTree.get(interest.name);
    if (!nameTreeNode.getItem())
      nameTreeNode.setItem(new PIT.Node());

    var pitNode = nameTreeNode.getItem();

    if (!pitNode.addEntry(interest, face, resolve, reject))
      reject(new Error("PIT.insert(interest): interest is duplicate"));
  });
};

PIT.prototype.lookup = function PIT_lookup(data, face){
  var self = this;
  return new Promise(function PIT_lookup_Promise(resolve,reject){
    var nameWithDigest = data.name.getPrefix(data.name.size());

    nameWithDigest.append("sha256digest=" + crypto.createHash('sha256')
                                                  .update(data.wireEncode()
                                                              .buffer)
                                                  .digest()
                                                  .toString('hex'));

    self._nameTree.up(nameWithDigest);
    self._nameTree.skip(function(node){
      return (!node.getItem());
    });

    var results = [];

    for(var ntnode of self._nameTree){
      var pitNode = ntnode.getItem();
      for(var entry in pitNode._entries){
        if (pitNode._entries[entry].interest.matchesName(data.name)){

          var ent = pitNode._entries.splice(entry, 1)[0];
          clearTimeout(ent.timeID);

          ent.resolve({
            data   : data
            , face : face
            , rtt  : Date.now() - ent.inserted
          });

          if (ent.face){
            var dup = false;
            for (var face in results){
              if (results[face] === ent.face){
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
    if (this._entries[index].interest === interest){
      this._entries[index].reject();
      return this._entries.splice(index, 1)[0];
    }
}

PIT.Node.prototype.addEntry = function PIT_Node_addEntry(interest, face, resolve, reject){
  var self = this;
  for (var entry of this._entries)
    if (entry.interest.getNonce().equals(interest.getNonce()))
      return false;

  this._entries.push({
    interest  : interest
    , resolve : resolve
    , reject  : reject
    , face    : face
    , inserted : Date.now()
    , timeID  : setTimeout(function PIT_Node_entry_timeout(){
        self.timeout(interest);
      }, interest.getInterestLifetimeMilliseconds() || 1)
  });
  return true;
}





/**Pending Interest Table
 *@constructor
 *@param {NameTree} nameTree the nameTree to build the table on top of
 *@returns {PIT} a new PIT
 */



module.exports = PIT;
