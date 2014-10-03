var ndn
  , Face
  , debug = require("debug")("Interfaces")
  , ndn = require("ndn-lib")
  , TlvDecoder = require("ndn-lib/js/encoding/tlv/tlv-decoder.js").TlvDecoder
  , Tlv = require("ndn-lib/js/encoding/tlv/tlv.js").Tlv;

/**Interface manager
 *@constructor
 *@param {Subject} Subject - a {@link Subject} instance
 *@returns {Interfaces} - a new Interface manager
 */
var Interfaces = function Interfaces(Subject){
  debug("constructed");
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
  debug("installing %s", Transport.prototype.name);
  if (Transport.Listener){
    debug("calling listener method");
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
  debug("newFace called");
  debug("protocol: %s", protocol);
  debug("connectionParameters: %s", connectionParameters);
  debug("onopen: %s", onopen);
  debug("onclose: %s", onclose);

  if (!this.transports[protocol]){
    debug("transport protocol not supported (or installed), aborting");
    return -1;
  } else {
    var Transport = new this.transports[protocol](connectionParameters)
      , newFace =  new ndn.Face(Transport, Transport.connectionInfo);

    debug("transport and face constructed");

    this.Faces.push(newFace);
    newFace.faceID = this.Faces.length - 1;
    var connectionInfo;

    if (protocol === "WebSocketTransport"){
      debug("TOFIX: align better with ndn-js transport API");
      connectionInfo = new this.transports[protocol].ConnectionInfo(connectionParameters.host, connectionParameters.port);
    } else {
      connectionInfo = newFace.connectionInfo;
    }
    if (onclose){
      newFace.onclose = onclose;
    }

    newFace.transport.connect(connectionInfo, newFace, function(){
      debug("TOFIX: calling connect manually, onopen triggered for face %s over transport %s", newFace.faceID, protocol);

      newFace.onReceivedElement = function(element){
        debug("onReceivedElement called on face %s", newFace.faceID);

        var decoder = new TlvDecoder(element);
        if (decoder.peekType(Tlv.Interest, element.length)) {
          debug("detected Interest");
          Self.subject.handleInterest(element, this.faceID);
        }
        else if (decoder.peekType(Tlv.Data, element.length)) {
          debug("detected Data");
          Self.subject.handleData(element, this.faceID);
        }
      };

      newFace.send = function(element){

        this.transport.send(element);
      };

      if (onopen) {
        debug("calling onopen for face %s", newFace.faceID);
        onopen(newFace.faceID);
      }
    }, function(){
      //onclose event TODO
      if (onclose) {
        debug("calling onclose for face %s", newFace.faceID);
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
  debug("dispatch to flag: %s", faceFlag);
  if (faceFlag){
    for (var i = 0; i < faceFlag.toString(2).length; i++){
      if (faceFlag & (1<<i) ){
        if (this.Faces[i]){
          debug("send on face %s", i);
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
