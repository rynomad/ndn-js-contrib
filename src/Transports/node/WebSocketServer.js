/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader
  , Transport = require("ndn-lib/js/transport/transport.js").Transport
  , wss = require('ws').Server;

/** ServerSide websocket transport,
 *@constructor
 *@param {WebSocket} ws a connected websocket
 *@returns {Transport} the transport
 */
var WebSocketServerTransport = function WebSocketServerTransport(ws)
{
  Transport.call(this);
  this.ws = ws;
  return this;
};

/**
 *@property {String} protocolKey "wsServer"
 */

WebSocketServerTransport.prototype.name = "WebSocketServerTransport";

WebSocketServerTransport.prototype = new Transport();
WebSocketServerTransport.prototype.name = "messageChannelTransport";

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

WebSocketServerTransport.defineListener = function(port){
  port = port || 7575;

  this.Listener = function(newFace){
    this.server = new wss({port: port});
    this.server.on('connection', function(ws){
      newFace("wsServer", ws);
    });
  };
};

WebSocketServerTransport.prototype.connect = function(connectionInfo,face, onopenCallback, third)
{
  this.elementReader = new ElementReader(face);

  // Connect to local ndnd via TCP
  var self = this;

  this.ws.on('message', function(data) {
    if (typeof data === 'object') {
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


  this.ws.on('error', function() {
    console.log('socket.onerror: TCP socket error');
  });

  this.ws.on('close', function() {
    console.log('socket.onclose: TCP connection closed.');

    self.wst = null;

    // Close Face when TCP Socket is closed
    face.closeByTransport();
  });

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
  console.log('WS connection closed.');
};

module.exports = WebSocketServerTransport;
