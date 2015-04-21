var ElementReader = require("ndn-js/js/encoding/element-reader.js").ElementReader;
var Transport = require("ndn-js/js/transport/transport.js").Transport;
var Peer = require("peerjs");


/**Transport Class for HTML5 DataConnections
 *@constructor
 *@param {DataConnection_Port} port one end of an HTML DataConnection
 *@returns {DataConnectionTransport}
 */
function DataConnectionTransport (params) {
  Transport.call(this);
  this.connectionInfo = new DataConnectionTransport.ConnectionInfo(params);
  return this;
}


DataConnectionTransport.prototype = new Transport();
DataConnectionTransport.prototype.name = "DataConnectionTransport";

DataConnectionTransport.ConnectionInfo = function DataConnectionTransportConnectionInfo(params){
  Transport.ConnectionInfo.call(this);
  this._host = params.host || location.hostname;
  this._path = params.path || "/";
  this._port = params.port || 8787;
  this._id = params.id;
  this._dataConnection = params._dataConnection;

  this._peer = params.peer
            || DataConnectionTransport._peers["peerjs:" + this._host + ":" + this._port + this._path]
            || false;

  if(!this._peer){
    this.peer = new Peer({
      host   : this._host
      , port : this._port
      , path : this._path
    });
    DataConnectionTransport._peers["peerjs:" + this._host + ":" + this._port + this._path] = this._peer;
  }

};

DataConnectionTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
DataConnectionTransport.ConnectionInfo.prototype.name = "DataConnectionTransport.ConnectionInfo";

DataConnectionTransport.ConnectionInfo.prototype.equals = function(other)
{
  if (other === null || other._dataConnection === undefined){
    return false;
  }
  return (this._dataConnection === other._dataConnection);
};

/**Set the event listener for incoming elements
 *@param {Object} face the ndn.Face object that this transport is attached to
 *@param {function} onopenCallback a callback to be performed once the transport is open
 */
DataConnectionTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  this._dataConnection = connectionInfo._dataConnection
                      || connectionInfo._peer.connect(connectionInfo.id);

  if (this._dataConnection.open)
    onopenCallback();



  this.elementReader = new ElementReader(elementListener);
  var self = this;

  this._dataConnection.on("data", function DataConnection_onData(data) {
   debug.debug('onmessage called', ev);
    if (element instanceof ArrayBuffer) {
      var bytearray = new Buffer(new Uint8Array(element));

      try {
        // Find the end of the binary XML element and call face.onReceivedElement.
        self.elementReader.onReceivedData(bytearray);
      } catch (ex) {
        debug("onmessage exception: ",   ex);
        return;
      }
    }
  };


  this._dataConnection.on("open", function DataConnection_onOpen(data)  {

    onclosedCallback();
  };

  this._dataConnection.on("error", function DataConnection_onError(err)  {
   debug.debug('dataconnection.onerror: ReadyState: ' , this.readyState);
   debug.debug('dataconnection.onerror: WebRTC error: ' , err);
  };

  this._dataConnection.on("closed", function DataConnection_onClose(data)  {

    onclosedCallback();
  };
};

/**Send the Uint8Array data.
 *@param {Buffer} element the data packet
 */
DataConnectionTransport.prototype.send = function(element)
{
  debug.debug("attempting to send", element, this.connectionInfo.getChannel());
  if(this._dataConnection.open){
    this._dataConnection.send(element);
  } else {
    throw new Error("dataConnection not open")
  }
};


module.exports = DataConnectionTransport;
