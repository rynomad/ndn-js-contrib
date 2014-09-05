var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader;
var Transport = require("ndn-lib/js/transport/transport.js").Transport;


/**Transport Class for HTML5 DataChannels
 *@constructor
 *@param {DataChannel_Port} port one end of an HTML DataChannel
 *@returns {DataChannelTransport}
 */
function DataChannelTransport (channel) {
  Transport.call(this);
  this.connectionInfo = new DataChannelTransport.ConnectionInfo(channel);
  return this;
}


DataChannelTransport.prototype = new Transport();
DataChannelTransport.prototype.name = "DataChannelTransport";

DataChannelTransport.ConnectionInfo = function DataChannelTransportConnectionInfo(channel){
  Transport.ConnectionInfo.call(this);

  channel.binaryType = "arraybuffer";
  this.channel = channel;
};

DataChannelTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
DataChannelTransport.ConnectionInfo.prototype.name = "DataChannelTransport.ConnectionInfo";

DataChannelTransport.ConnectionInfo.prototype.getChannel = function()
{
  return this.channel;
};

DataChannelTransport.ConnectionInfo.prototype.equals = function(other)
{
  if (other === null || other.port === undefined){
    return false;
  }
  return (this.port === other.port);
};

/**Set the event listener for incoming elements
 *@param {Object} face the ndn.Face object that this transport is attached to
 *@param {function} onopenCallback a callback to be performed once the transport is open
 */
DataChannelTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  console.log("DataChannel connect");
  this.elementReader = new ElementReader(elementListener);
  var self = this;
  connectionInfo.getChannel().onmessage = function(ev) {
    if (ev.data.buffer instanceof ArrayBuffer) {
      try {
        self.elementReader.onReceivedData(new Buffer(ev.data));
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: ", ex);
        return;
      }
    }
  };

  connectionInfo.getChannel().onmessage = function(ev) {
    //console.log('dc.onmessage called', ev)
    if (ev.data instanceof ArrayBuffer) {

      var result = ev.data;
      //console.log('RecvHandle called.', result);
      var bytearray = new Buffer(new Uint8Array(result));
      //console.log(bytearray)

      //console.log('BINARY RESPONSE IS ' + bytearray.toString('hex'));

      try {
        //console.log(self, face)
        // Find the end of the binary XML element and call face.onReceivedElement.
        self.elementReader.onReceivedData(bytearray);
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: ",   ex);
        return;
      }
    }
  };


  connectionInfo.getChannel().onopen = function(ev) {
    console.log('dc.onopen: ReadyState: ' + this.readyState);
        // Face.registerPrefix will fetch the ndndid when needed.

    onopenCallback();
  }

  connectionInfo.getChannel().onerror = function(ev) {
    //console.log('dc.onerror: ReadyState: ' + this.readyState);
    //console.log(ev);
    //console.log('dc.onerror: WebRTC error: ' + ev.data);
  }

  connectionInfo.getChannel().onclose = function(ev) {
    console.log('dc.onclose: WebRTC connection closed.');
    self.dc = null;

    // Close Face when WebSocket is closed
    self.face.readyStatus = 3;
    self.face.closeByTransport();
    onclosedCallback();
    //console.log("NDN.onclose event fired.");
  }

  if (connectionInfo.getChannel().readyState === "open"){
    onopenCallback();
  }
};

/**Send the Uint8Array data.
 *@param {Buffer} element the data packet
 */
DataChannelTransport.prototype.send = function(element)
{
  //console.log("attempting to send", element, this.connectionInfo.getChannel())
  if(this.connectionInfo.getChannel().readyState === "open"){
    this.connectionInfo.getChannel().send(element.toArrayBuffer());
  } else {
    console.log("not trying to send, dataChannel not open")
  }
};


/**Define a connection listener for the {@link Interfaces} module. This Class method must be called before installing the class into Interfaces (if you want a Listener)
 *@param {Number=} - port the port for the listener to listen on, default 7575
 *//**))
DataChannelTransport.defineListener = function(subject, namespace){

  subject.contentStore.insert()

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
*/
module.exports = DataChannelTransport;
