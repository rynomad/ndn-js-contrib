var ndn
  , Face
  , ndn = require("ndn-lib")
  , TlvDecoder = require("ndn-lib/js/encoding/tlv/tlv-decoder.js").TlvDecoder
  , Tlv = require("ndn-lib/js/encoding/tlv/tlv.js").Tlv;

/**Interface manager
 *@constructor
 *@param {Subject} Subject - a {@link Subject} instance
 *@returns {Interfaces} - a new Interface manager
 */
function Interfaces(Subject){

  this.subject = Subject;
  this.transports = {};
  Face = ndn.Face;

  return this;
}

/**Class method to install ndn-lib. Only necessary if you require("ndn-classes/src/DataStructures/Interfaces.js"), done for you if require('ndn-classes').Interfaces
 *@private
 *@param {Object} - NDN the ndn-lib object
 */
Interfaces.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

Interfaces.prototype.transports = {};

Interfaces.prototype.Faces = [];

/**Install a transport Class to the Interfaces manager. If the Class has a Listener function, the Listener will be invoked
 *@param {Transport} Transport a Transport Class matching the Abstract Transport API
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.installTransport = function(Transport){
  this.transports[Transport.prototype.name] = Transport;

  if (Transport.Listener){
    Transport.Listener(this.newFace);
  }

  return this;
};

/**Create a new Face
 *@param {String} protocol a string matching the .protocolKey property of a previously installed {@link Transport}
 *@param {Object} connectionParameters the object expected by the transport class
 *@returns {Number} id the numerical faceID of the created Face.
 */
Interfaces.prototype.newFace = function(protocol, connectionParameters, onopen, onclose) {
  var Self = this;

  if (!this.transports[protocol]){
    return -1;
  } else {
    var Transport = new this.transports[protocol](connectionParameters)
      , newFace =  new ndn.Face(Transport, Transport.connectionInfo);

    this.Faces.push(newFace);
    newFace.faceID = this.Faces.length - 1;

    newFace.transport.connect(newFace.connectionInfo, newFace, function(){
      newFace.onReceivedElement = function(element){
        //console.log("onReceivedElement")
        var decoder = new TlvDecoder(element);
        if (decoder.peekType(Tlv.Interest, element.length)) {
          Self.subject.handleInterest(element, this.faceID);
        }
        else if (decoder.peekType(Tlv.Data, element.length)) {
          Self.subject.handleData(element, this.faceID);
        }
      };

      newFace.send = function(element){
        this.transport.send(element);
      };

      if (onopen) {onopen();}
    }, function(){
      //onclose event TODO
      if (onclose) {onclose();}
    });
    return newFace.faceID;
  }
};

/** Dispatch an element to one or more Faces
 *@param {Buffer} element the raw packet to dispatch
 *@param {Number} faceFlag an Integer representing the faces to send one
 *@param {Function} callback called per face sent, used for testing
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.dispatch = function(element, faceFlag, callback){
  if (faceFlag){
    for (var i = 0; i < faceFlag.toString(2).length; i++){
      if (faceFlag & (1<<i) ){
        this.Faces[i].send(element);
        if (callback){
          callback(i);
        }
      }
    }
  }
  return this;
};

module.exports = Interfaces;
