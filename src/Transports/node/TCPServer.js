/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang, forked and adapted by Ryan Bennett.
 * See COPYING for copyright and distribution information.
 */
var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader
  , Transport = require("ndn-lib/js/transport/transport.js").Transport
  , net = require('net');


var TCPServerTransport = function serverTcpTransport(socketOrAddress)
{
  var self = this;
  if (typeof socketOrAddress === "string"){
    console.log("dfadfafdadsfafdafdafd")
    console.log(socketOrAddress, socketOrAddress.split(":")[2], socketOrAddress.split("://")[1].split(":")[0])
    this.socket = net.connect(socketOrAddress.split(":")[2] || 7474, socketOrAddress.split("://")[1].split(":")[0] || 'localhost', function(sock){
      self.socket = sock;
      console.log("made socket")
      self.connectedHost = socketOrAddress.split("://")[1] || 'localhost'; // Read by Face.
      self.connectedPort = socketOrAddress.split(":")[2] || 7474;

      self.sock_ready = true;
    });
  } else {
    this.socket = socketOrHostAndPort;
    this.connectedHost = null; // Read by Face.
    this.connectedPort = null; // Read by Face.
  }
  return this;
};

TCPServerTransport.prototype.name = "TCPServerTransport";

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
 *@param {Number=} - port the port for the listener to listen on, default 7575
 */
TCPServerTransport.defineListener = function(Subject, port){
  port = port || 7474;

  this.Listener = function (interfaces) {
    this.server = net.createServer(function(socket){
      console.log("new socket")
      socket.on('end', function() {
        console.log('server disconnected');
      });
      interfaces.newFace("tcpServerTransport", socket);
    });
    this.server.listen(port, function(){
      //console.log('server awaiting connections');
    });
  };
};

TCPServerTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  this.elementReader = new ElementReader(elementListener);

  // Connect to local ndnd via TCP
  var self = this;
  elementListener.readyStatus = 2;

  this.socket.on('data', function(data) {
    console.log("got data on server tcp");
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


  this.socket.on('error', function() {
    console.log('socket.onerror: TCP socket error');
  });

  this.socket.on('close', function() {
    console.log('socket.onclose: TCP connection closed.');

    self.socket = null;

    // Close Face when TCP Socket is closed
    elementListener.closeByTransport();
  });
  this.socket.on('connection', function() {
    console.log('new connection');
    onopenCallback();
  });

  this.connectedHost = 111;
  this.connectedPort = 111;

};

TCPServerTransport.prototype.send = function(/*Buffer*/ data)
{
  if (this.sock_ready)
  {
    console.log("writing data to socket");
    this.socket.write(data);
  }else{
    console.log('TCP connection is not established.');
  }
};

TCPServerTransport.prototype.close = function()
{
  this.socket.end();
  console.log('TCP connection closed.');
};

module.exports = TCPServerTransport;
