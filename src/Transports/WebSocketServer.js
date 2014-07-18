/**
 * Copyright (C) 2013-2014 Regents of the University of California.
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var customBuf = require("ndn-lib").customBuffer
var DataUtils = require('ndn-lib').DataUtils;
var ElementReader = require('ndn-lib').ElementReader;


var websocketServerTransport = function websocketServerTransport(ws)
{
  this.ws = ws;
};


websocketServerTransport.prototype.connect = function(face, onopenCallback)
{


  this.elementReader = new ElementReader(face);

  // Connect to local ndnd via TCP
  var self = this;

  this.ws.on('message', function(data) {
    console.log("got data on server ws", typeof data)
    if (typeof data == 'object') {
      // Make a copy of data (maybe a customBuf or a String)
      var buf = new customBuf(data);
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

  this.connectedHost = 111
  this.connectedPort = 111
  onopenCallback()

};

/**
 * Send data.
 */
websocketServerTransport.prototype.send = function(/*Buffer*/ data)
{
  console.log("sending ")
  if (!this.ws == false)
  {
    console.log("writing data to ws")
    this.ws.send(data);
  }else
    console.log('WS connection is not established.');
};

/**
 * Close transport
 */
websocketServerTransport.prototype.close = function()
{
  try {

    this.ws.end();
  } catch (er){
  }
  console.log('TCP connection closed.');
};

module.exports.transport = websocketServerTransport
