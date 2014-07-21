var ndn
  , Face
  , Faces = [];

/**Interface manager
 *@constructor
 *@param {@link Subject} Subject - a {@link Subject} instance
 *@returns {Interfaces} - a new Interface manager
 */
function Interfaces(Subject){
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

/**Class method to install ndn-lib
 *@param {@link NDN} - NDN the ndn-lib object
 */
Interfaces.installNDN = function(NDN){
  ndn = NDN;
};

Interfaces.prototype.transports = {};


/**Install a transport Class to the Interfaces manager. If the Class has a Listener function, the Listener will be invoked
 *@param {@link Transport} Transport a Transport Class matching the Abstract Transport API
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.installTransport = function(Transport){
  this.transports[Transport.protocolKey] = Transport;

  if (Transport.Listener && Transport.Listen){
    Transport.Listener(this.newFace);
  }

  return this;
};

/**Create a new Face
 *@param {String} protocol a string matching the .protocolKey property of a previously installed {@link Transport}
 *@returns {Number} id the numerical faceID of the created Face.
 */
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

/** Dispatch an element to one or more Faces
 *@param {Buffer} element the raw packet to dispatch
 *@param {Number} faceFlag an Integer representing the faces to send one
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.dispatch = function(element, faceFlag){
  if (faceFlag){
    for (var i = 0; i < faceFlag.toString(2).length; i++){
      if (faceFlag & (1<<i) ){
        Faces[i].send(element);
      }
    }
  }
  return this;
};

module.exports = Faces;
