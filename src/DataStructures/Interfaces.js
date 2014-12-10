var ndn
  , Face
  , debug = {}
  , ndn = require("ndn-js")
  , TlvDecoder = require("ndn-js/js/encoding/tlv/tlv-decoder.js").TlvDecoder
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
  this.Faces = new Interfaces.List();

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

Interfaces.List = function(){
  this.head = null;
  this.size = 0;
  this.index = 0
  return this;
};

Interfaces.ListNode = function (face, next){
  this.next = next;
  this.face = face;
  return this;
}

Interfaces.List.prototype.addFace = function (face){
  face.id = this.index;

  if (this.size){
    var curr = this.head;
    while (curr.next){
      curr = curr.next;
    }
    curr.next = new Interfaces.ListNode(face, null);
  } else {
    this.head = new Interfaces.ListNode(face, null);
  }

  this.size++;
  this.index++;

  return face.id;
}

Interfaces.List.prototype.removeFace = function(id){
  var curr = this.head;
  while (curr && curr.next && (curr.next.face.id > id)){
    curr = curr.next;
  }
  if (curr.next.id === id){
    curr.next = curr.next.next;
    this.size--;
  }
}

Interfaces.List.prototype.dispatchByIds = function (idArray, buffer){
  var id, curr = this.head;
  while (idArray.length){
    id = idArray.pop();
    while (curr && curr.face.id < id){
      curr = curr.next;
    }
    if (curr.face.id === id){
      curr.face.send(buffer);
    }
  }
};

Interfaces.List.prototype.get = function(id){
  var curr = this.head;
  while(curr && curr.face && curr.face.id < id){
    curr = curr.next;
  }
  if (curr && curr.face && curr.face.id === id){
    return curr.face;
  } else {
    return null;
  }
}

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

    this.Faces.addFace(newFace);
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
     debug.debug("TOFIX: calling connect manually, onopen triggered for face %s over transport %s", newFace.id, protocol);

      newFace.onReceivedElement = function(element){
       debug.debug("onReceivedElement called on face %s", newFace.id);

        var decoder = new TlvDecoder(element);
        if (decoder.peekType(Tlv.Interest, element.length)) {
         debug.debug("detected Interest");
          Self.subject.handleInterest(element, this.id);
        }
        else if (decoder.peekType(Tlv.Data, element.length)) {
         debug.debug("detected Data");
          Self.subject.handleData(element, this.id);
        }
      };

      newFace.send = function(element){

        this.transport.send(element);
      };

      if (onopen) {
       debug.debug("calling onopen for face %s", newFace.id);
        onopen(newFace.id);
      }
    }, function(){
      //onclose event TODO
      if (onclose) {
       debug.debug("calling onclose for face %s", newFace.id);
        onclose(newFace.id);
      }
    });
    return newFace.id;
  }
};

Interfaces.prototype.closeFace = function(){};

/** Dispatch an element to one or more Faces
 *@param {Buffer} element the raw packet to dispatch
 *@param {Number} faceFlag an Integer representing the faces to send one
 *@param {Function} callback called per face sent, used for testing
 *@returns {Interfaces} for chaining
 */
Interfaces.prototype.dispatch = function(element, faceIDs, callback){
 debug.debug("dispatch to flag: %s", faceIDs);
  this.Faces.dispatchByIds(faceIDs, element);

  return this;
};

module.exports = Interfaces;
