var ndn
  , Face
  , debug = {}
  , ndn = require("ndn-js")
  , TlvDecoder = require("ndn-lib/js/encoding/tlv/tlv-decoder.js").TlvDecoder
  , Tlv = require("ndn-js/js/encoding/tlv/tlv.js").Tlv;
debug.debug= require("debug")("Interfaces");

/**Interface manager
 *@constructor
 *@param {Subject} Subject - a {@link Subject} instance
 *@returns {Interfaces} - a new Interface manager
 */
var Interfaces = function Interfaces(Subject){
 debug.debug("constructed");
  this.subject = Subject;
  this.transports = {};
  Face = ndn.Face;
  this.Faces = [];

  return this;
};

/**Class method to install ndn-lib. Only necessary if you require("ndn-classes/src/DataStructures/Interfaces.js"), done for you if require('ndn-classes').Interfaces
 *@private
 *@param {Object} - NDN the ndn-lib object
 */
Interfaces.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

Interfaces.prototype.transports = {};


/**Install a transport Class to the Interfaces manager. If the Class has a Listener function, the Listener will be invoked
 *@param {Transport} Transport a Transport Class matching the Abstract Transport API
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.installTransport = function(Transport){
  this.transports[Transport.prototype.name] = Transport;
 debug.debug("installing %s", Transport.prototype.name);
  if (Transport.Listener){
   debug.debug("calling listener method");
    Transport.Listener(this);
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
 debug.debug("newFace called");
 debug.debug("protocol: %s", protocol);
 debug.debug("connectionParameters: %s", connectionParameters);
 debug.debug("onopen: %s", onopen);
 debug.debug("onclose: %s", onclose);

  if (!this.transports[protocol]){
   debug.debug("transport protocol %s not supported (or installed), aborting", protocol);
    return -1;
  } else {
    var Transport = new this.transports[protocol](connectionParameters)
      , newFace =  new ndn.Face(Transport, Transport.connectionInfo);

   debug.debug("transport and face constructed");

    this.Faces.push(newFace);
    newFace.faceID = this.Faces.length - 1;
    var connectionInfo;

    if (protocol === "WebSocketTransport"){
     debug.debug("TOFIX: align better with ndn-js transport API");
      connectionInfo = new this.transports[protocol].ConnectionInfo(connectionParameters.host, connectionParameters.port);
    } else {
      connectionInfo = newFace.connectionInfo || Transport.connectionInfo ||new this.transports[protocol].ConnectionInfo(Transport.socket);
    }

    debug.debug("%s face connectionInfo: %s", protocol, connectionInfo);
    if (onclose){
      newFace.onclose = onclose;
    }

    newFace.transport.connect(connectionInfo, newFace, function(){
     debug.debug("TOFIX: calling connect manually, onopen triggered for face %s over transport %s", newFace.faceID, protocol);

      newFace.onReceivedElement = function(element){
       debug.debug("onReceivedElement called on face %s", newFace.faceID);

        var decoder = new TlvDecoder(element);
        if (decoder.peekType(Tlv.Interest, element.length)) {
         debug.debug("detected Interest");
          Self.subject.handleInterest(element, this.faceID);
        }
        else if (decoder.peekType(Tlv.Data, element.length)) {
         debug.debug("detected Data");
          Self.subject.handleData(element, this.faceID);
        }
      };

      newFace.send = function(element){

        this.transport.send(element);
      };

      if (onopen) {
       debug.debug("calling onopen for face %s", newFace.faceID);
        onopen(newFace.faceID);
      }
    }, function(){
      //onclose event TODO
      if (onclose) {
       debug.debug("calling onclose for face %s", newFace.faceID);
        onclose(newFace.faceID);
      }
    });
    return newFace.faceID;
  }
};

Interfaces.prototype.closeFace = function(){};

/** Dispatch an element to one or more Faces
 *@param {Buffer} element the raw packet to dispatch
 *@param {Number} faceFlag an Integer representing the faces to send one
 *@param {Function} callback called per face sent, used for testing
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.dispatch = function(element, faceFlag, callback){
 debug.debug("dispatch to flag: %s", faceFlag);
  if (faceFlag){
    for (var i = 0; i < faceFlag.toString(2).length; i++){
      if (faceFlag & (1<<i) ){
        if (this.Faces[i]){
         debug.debug("send on face %s", i);
          this.Faces[i].transport.send(element);
        }
        if (callback){
          callback(i);
        }
      }
    }
  }
  return this;
};

module.exports = Interfaces;
