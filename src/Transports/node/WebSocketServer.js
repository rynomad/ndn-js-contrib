/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader
  , Transport = require("ndn-lib/js/transport/transport.js").Transport
  , wes = require('ws')
  , wss = wes.Server;

/** ServerSide websocket transport,
 *@constructor
 *@param {WebSocket} ws a connected websocket
 *@returns {Transport} the transport
 */
var WebSocketServerTransport = function WebSocketServerTransport(ws)
{
  var Self = this;
  Transport.call(this);
  if (typeof ws === "string"){
    if (ws.split(":").length === 2){
      ws = ws + ":7575";
    }
    console.log("SSSSSSSSSSSSSSSSSSSSS",ws)
    this.ws = new wes(ws);
  } else{
    this.ws = ws;
  }

  return this;
};

/**
 *@property {String} protocolKey "wsServer"
 */

WebSocketServerTransport.prototype.name = "WebSocketServerTransport";

WebSocketServerTransport.prototype = new Transport();
WebSocketServerTransport.prototype.name = "WebSocketServerTransport";

WebSocketServerTransport.ConnectionInfo = function WebSocketServerTransportConnectionInfo(socket){
  Transport.ConnectionInfo.call(this);
  this.socket = socket;
};

WebSocketServerTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
WebSocketServerTransport.ConnectionInfo.prototype.name = "WebSocketServerTransport.ConnectionInfo";

WebSocketServerTransport.ConnectionInfo.prototype.getSocket = function()
{
  return this.socket;
};

WebSocketServerTransport.defineListener = function(Subject, port){
  var Self = this;
  port = port || 7575;
  console.log("port", port)

  this.Listener = function(interfaces){
    Self.server = new wss({port: port});
    Self.server.on('connection', function(ws){
      console.log("got incoming connection")
      interfaces.newFace("WebSocketServerTransport", ws);
    });
  };
};

WebSocketServerTransport.prototype.connect = function(connectionInfo,face, onopenCallback, onClose)
{
  this.elementReader = new ElementReader(face);

  // Connect to local ndnd via TCP
  var self = this;
  face.readyStatus = 2;

  this.ws.on('message', function(data) {
    if (typeof data === 'object') {
      console.log(data)
      // Make a copy of data (maybe a customBuf or a String)
      var buf = new Buffer(data);
      try {
        // Find the end of the binary XML element and call face.onReceivedElement.
        self.elementReader.onReceivedData(buf);
      } catch (ex) {
        console.log("NDN.TcpTransport.ondata exception: " + ex);
        return;
      }
    }
  });


  this.ws.on('error', function(er) {
    console.log(er)
    console.log('ws.onerror: ws socket error');
  });

  this.ws.on('close', function() {
    console.log('ws.onclose: ws connection closed.');

    self.wst = null;

    // Close Face when TCP Socket is closed
    face.closeByTransport();
    onClose();
  });
  this.onClose = onClose || function(){}
  this.connectedHost = 111;
  this.connectedPort = 111;
  onopenCallback();

};

/**
 * Send data.
 */
WebSocketServerTransport.prototype.send = function(/*Buffer*/ data)
{
  try{
    console.log("sending data", data)
    this.ws.send(data, {binary: true});
  }catch (er){
    console.log('WS connection is not established.', er);
  }
};

/**
 * Close transport
 */
WebSocketServerTransport.prototype.close = function()
{
  try {
    this.ws.end();
  } catch (er){
  }

  this.onClose();
  console.log('WS connection closed.');
};

module.exports = WebSocketServerTransport;
