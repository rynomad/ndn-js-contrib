/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang, forked and adapted by Ryan Bennett.
 * See COPYING for copyright and distribution information.
 */
var ElementReader = require("ndn-js/js/encoding/element-reader.js").ElementReader
  , Transport = require("ndn-js/js/transport/transport.js").Transport
  , net = require('net')
  , debug = {};
  debug.debug  = require("debug")("TCPServerTransport");


var TCPServerTransport = function serverTcpTransport(socketOrAddress)
{
  var self = this;
  if (typeof socketOrAddress === "string"){

    debug.debug("constructed with string: %s", socketOrAddress);
    this.socket = net.connect(socketOrAddress.split(":")[2] || 8484, socketOrAddress.split("://")[1].split(":")[0] || 'localhost', function(sock){
      debug.debug("got callback from net.connect %s", socketOrAddress);
      debug.debug("made socket");
      self.connectedHost = socketOrAddress.split("://")[1] || 'localhost'; // Read by Face.
      self.connectedPort = socketOrAddress.split(":")[2] || 8484;

      self.sock_ready = true;
    });
  } else {
    debug.debug("constructed with existing socket");
    this.socket = socketOrAddress;
    this.connectedHost = null; // Read by Face.
    this.connectedPort = null; // Read by Face.
  }
  return this;
};


TCPServerTransport.prototype = new Transport();
TCPServerTransport.prototype.name = "TCPServerTransport";

TCPServerTransport.ConnectionInfo = function TCPServerTransportConnectionInfo(socket){
  Transport.ConnectionInfo.call(this);
  this.socket = socket;
};

TCPServerTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
TCPServerTransport.ConnectionInfo.prototype.name = "TCPServerTransport.ConnectionInfo";

TCPServerTransport.ConnectionInfo.prototype.getSocket = function()
{
  return this.socket;
};

/**Define a connection listener for the {@link Interfaces} module. This Class method must be called before installing the class into Interfaces (if you want a Listener)
 *@param {Number=} - port the port for the listener to listen on, default 8585
 */
TCPServerTransport.defineListener = function(Subject, port){
  port = port || 8484;


  debug.debug("defining listener on port: %s", port);

  this.Listener = function (interfaces) {
    this.server = net.createServer(function(socket){
      debug.debug("server got new client socket on port %s", port);
      socket.on('end', function() {
        debug.debug('socket disconnected');
      });
      interfaces.newFace("TCPServerTransport", socket, function(id){
        debug.debug("got newface callback from interfaces with face ID: %s", id);
        var toConnect = interfaces.Faces.get(id);
        toConnect.transport.connect({}, toConnect, function(){}, function(){});
      }, function(){

      });
    });
    this.server.listen(port, function(){
      debug.debug('server awaiting connections');
    });
  };
};

TCPServerTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  this.elementReader = new ElementReader(elementListener);
  debug.debug("got connect call");
  // Connect to local ndnd via TCP
  var self = this;
  elementListener.readyStatus = 2;

  this.socket.on('data', function(data) {
    debug.debug("got data");
    if (typeof data === 'object') {
      // Make a copy of data (maybe a customBuf or a String)
      var buf = new Buffer(data);
      try {
        // Find the end of the binary XML element and call face.onReceivedElement.
        self.elementReader.onReceivedData(buf);
      } catch (ex) {
        debug.debug("NDN.TcpTransport.ondata exception: " + ex);
        return;
      }
    }
  });


  this.socket.on('error', function() {
    debug.debug('socket.onerror: TCP socket error');
  });

  this.socket.on('close', function() {
    debug.debug('socket.onclose: TCP connection closed. calling closeByTransport');

    self.socket = null;

    // Close Face when TCP Socket is closed
    elementListener.closeByTransport();
  });
  this.socket.on('connection', function() {
    debug.debug('new connection, calling onOpenCallback');
    onopenCallback();
  });
  onopenCallback();

  this.connectedHost = 111;
  this.connectedPort = 111;

};

TCPServerTransport.prototype.send = function(/*Buffer*/ data)
{
  try {
    this.socket.write(data);
  }catch (e){
    debug.debug('TCP send error: %s', e.message);
  }
};

TCPServerTransport.prototype.close = function()
{
  this.socket.end();
  debug.debug('TCP connection closed.');
};

module.exports = TCPServerTransport;
