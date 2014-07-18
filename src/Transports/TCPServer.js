/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var customBuf = require("ndn-lib").customBuffer
var DataUtils = require('ndn-lib').DataUtils;
var ElementReader = require('ndn-lib').ElementReader;

var serverTcpTransport = function serverTcpTransport(socket)
{
  this.socket = socket;
  this.sock_ready = true;
  this.elementReader = null;
  this.connectedHost = null; // Read by Face.
  this.connectedPort = null; // Read by Face.
  this.sock_ready = true
};

exports.transport = serverTcpTransport;

serverTcpTransport.prototype.connect = function(face, onopenCallback)
{


  this.elementReader = new ElementReader(face);

  // Connect to local ndnd via TCP
  var self = this;

  this.socket.on('data', function(data) {
    console.log("got data on server tcp")
    if (typeof data == 'object') {
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

  this.connectedHost = 111
  this.connectedPort = 111
  onopenCallback()

};

/**
 * Send data.
 */
serverTcpTransport.prototype.send = function(/*Buffer*/ data)
{
  if (this.sock_ready)
  {
    console.log("writing data to socket")
    this.socket.write(data);
  }else
    console.log('TCP connection is not established.');
};

/**
 * Close transport
 */
serverTcpTransport.prototype.close = function()
{
  this.socket.end();
  console.log('TCP connection closed.');
};

module.exports = serverTcpTransport
