var th = require("telehash")
  , seeds = require("telehash-seeds")

module.exports = function(prefix, callback, password){
  if (localStorage[prefix + 'telehashID'] == undefined) {
    var self = this;
    console.log('generating keypair', th)
    th.init({}, function(err, selfie){
      if(err) return console.log("hashname generation/startup failed",err);
      var hn = selfie
      localStorage[prefix + 'telehashID'] = JSON.stringify(hn.id)
      seeds.install(hn)
      callback(hn)
    });
  } else {
    th.init({id:JSON.parse(localStorage[prefix + 'telehashID'])}, function(err, selfie){
      if(err) return console.log("hashname failed to come online",err);
      console.log("hashname online")
      self = selfie
      seeds.install(selfie)
      callback(selfie)
    });
  }
}
