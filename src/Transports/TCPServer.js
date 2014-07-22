/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader
  , net = require('net');


var TcpServerTransport = function serverTcpTransport(socketOrHostAndPort)
{
  var self = this;
  if (Object.keys(socketOrHostAndPort).length <= 2){
    net.connect(socketOrHostAndPort.port || 7575, socketOrHostAndPort.host || 'localhost', function(sock){
      self.socket = sock;
      self.connectedHost = socketOrHostAndPort.host || 'localhost'; // Read by Face.
      self.connectedPort = socketOrHostAndPort.port || 7575;

      self.sock_ready = true;
    });
  } else {
    this.socket = socket;
    this.connectedHost = null; // Read by Face.
    this.connectedPort = null; // Read by Face.
  }
  return this;
};

TcpServerTransport.protocolKey = "tcpServer";

/**Define a connection listener for the {@link Interfaces} module. This Class method must be called before installing the class into Interfaces (if you want a Listener)
 *@param {Number=} - port the port for the listener to listen on, default 7474
 */
TcpServerTransport.defineListener = function(port){
  port = port || 7474;

  this.Listener = function (newFace) {
    this.server = net.createServer(function(socket){
      socket.on('end', function() {
        console.log('server disconnected');
      });
      newFace("tcpServer", socket);
    });
    this.server.listen(port, function(){
      //console.log('server awaiting connections');
    });
  };
};

TcpServerTransport.prototype.connect = function(face, onopenCallback)
{
  this.elementReader = new ElementReader(face);

  // Connect to local ndnd via TCP
  var self = this;

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
    face.closeByTransport();
  });
  this.socket.on('connection', function() {
    console.log('new connection');
    onopenCallback();
  });

  this.connectedHost = 111;
  this.connectedPort = 111;

};

TcpServerTransport.prototype.send = function(/*Buffer*/ data)
{
  if (this.sock_ready)
  {
    console.log("writing data to socket");
    this.socket.write(data);
  }else{
    console.log('TCP connection is not established.');
  }
};

TcpServerTransport.prototype.close = function()
{
  this.socket.end();
  console.log('TCP connection closed.');
};

module.exports = TcpServerTransport;
