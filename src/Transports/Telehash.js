
var self

var ndn = require("ndn-lib");
var ElementReader = ndn.ElementReader;
var ndnbuf = ndn.customBuffer;
var Name = ndn.Name
var Data = ndn.Data

var telehash = {}

telehash.transport = function (hashname, channel) {
  this.hashname = hashname
  var faceSelf = this
  if (channel) {
    this.channel = channel

  }
};

telehash.start = function(appname, listenCallback) {
  function assigner (selfie){
    self = selfie
    listenCallback(self)
  }
  require("./lib/node/init.js")(appname, assigner, "testbspassword")
}

/**
 * Connect to the host and port in face.  This replaces a previous connection and sets connectedHost
 *   and connectedPort.  Once connected, call onopenCallback().
 * Listen on the port to read an entire binary XML encoded element and call
 *    face.onReceivedElement(element).
 */
telehash.transport.prototype.connect = function(face, onopenCallback)
{
  face.hashname = this.hashname
  this.elementReader = new ElementReader(face);
  var faceSelf= this;
  face.transport = this
  //console.log("call to connec!!!!!!!!!!!!!!!!!!!!!!")


  faceSelf.listener = function(end, packet, chan, cb) {
    //console.log("got packet!", chan, packet)
    faceSelf.channel = chan
    if ((packet) && (packet.js == "ndn")){

      var ev = packet.body
      console.log('RecvHandle called on telehash face', ev, typeof ev);
      try {
        // Find the end of the binary XML element and call face.onReceivedElement.
        faceSelf.elementReader.onReceivedData(ev);
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: " + ex);
        return;
      }
      // garbage collect arraybuffer
      //var ms = new MessageChannel()

    }
    cb(true)
  }
  if (!face.transport.channel || face.transport.channel.ended){
    //console.log("channel not defined, begin listening")
    self.start(face.transport.hashname, "ndn", {js:"incoming"}, function(err, packet, chan, callb){
      //console.log("defined channel", chan, packet)
      if (err) return
      faceSelf.listener(err, packet, chan, callb)
      face.transport.channel = chan
      face.transport.channel.callback = faceSelf.listener
      onopenCallback()

    })

  } else {
    face.transport.channel.callback = faceSelf.listener
    //console.log("channel defined, callingback", face.transport.channel.callback)
    onopenCallback()
  }



};

/**
 * Send the Uint8Array data.
 */
telehash.transport.prototype.send = function(data)
{
  var faceSelf = this
  console.log(!this.channel, !this.channel.ended)
  if ((!this.channel == false) && !this.channel.ended) {
    //console.log(data)
    this.channel.send({js:"ndn", body: data})

  }
  else{
    console.log('telehash connection is not established, try to start');
    self.start(this.hashname, "ndn", {js:"ndn", body: data}, faceSelf.listener)
  }
};

module.exports = telehash;
