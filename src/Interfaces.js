var ndn
  , Face
  , Faces = [];


function Interfaces(NDN, Subject){
  ndn = NDN;

  ndn.Face.prototype.onReceivedElement = function(element){
    var decoder = new ndn.TlvDecoder(element);
    if (decoder.peekType(ndn.Tlv.Interest, element.length)) {
      Subject.handleInterest(element, this.faceID);
    }
    else if (decoder.peekType(Tlv.Data, element.length)) {
      Subject.handleData(element, this.faceID);
    }
  };

  ndn.Face.prototype.send = function(element){
    this.transport.send(element);
  };

  Face = ndn.Face;

  return this;
}

Interfaces.prototype.transports = {};

Interfaces.prototype.addTransport = function(Transport){
  this.transports[Transport.protocolKey] = Transport;

  if (Transport.Listener && Transport.Listen){
    Transport.Listener(this.newFace);
  }

  return this;
};

Interfaces.prototype.newFace = function(protocol, connectionParameters) {
  var self = this;
  if (!this.transports[protocol]){
    return -1;
  } else {
    Faces.push(
      new Face({
        host   : connectionParameters.host || 1
        , port : connectionParameters.port || 1
        , getTransport : function(){return new self.transports[protocol](connectionParameters);}
      })
    );
    var id = Faces.length - 1;
    Faces[id].faceID = id;
    return id;
  }
};

Interfaces.prototype.dispatch = function(element, faceFlag){
  if (faceFlag){
    for (var i = 0; i < Faces.length; i++){
      if (faceFlag & (1<<i) ){
        Faces[i].send(element);
      }
    }
  }
  return this;
};

module.exports = Faces;
