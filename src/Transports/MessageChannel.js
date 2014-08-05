var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader;
var Transport = require("ndn-lib/js/transport/transport.js").Transport;

MessageChannelTransport.protocolKey = "messageChannel";

/**Transport Class for HTML5 MessageChannels
 *@constructor
 *@param {MessageChannel_Port} port one end of an HTML MessageChannel
 *@returns {MessageChannelTransport}
 */
function MessageChannelTransport (port) {
  Transport.call(this);
  this.connectionInfo = new MessageChannelTransport.ConnectionInfo(port);
  return this;
}


MessageChannelTransport.prototype = new Transport();
MessageChannelTransport.prototype.name = "messageChannelTransport";

MessageChannelTransport.ConnectionInfo = function MessageChannelTransportConnectionInfo(port){
  console.log(Transport);
  Transport.ConnectionInfo.call(this);
  this.port = port;
};

MessageChannelTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
MessageChannelTransport.ConnectionInfo.prototype.name = "MessageChannelTransport.ConnectionInfo";

MessageChannelTransport.ConnectionInfo.prototype.getPort = function()
{
  return this.port;
};

/**Set the event listener for incoming elements
 *@param {Object} face the ndn.Face object that this transport is attached to
 *@param {function} onopenCallback a callback to be performed once the transport is open
 */
MessageChannelTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  this.elementReader = new ElementReader(elementListener);
  var self = this;
  connectionInfo.getPort().onmessage = function(ev) {
    //console.log("onmessage")
    if (ev.data.buffer instanceof ArrayBuffer) {
      try {
        self.elementReader.onReceivedData(new Buffer(ev.data));
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: ", ex);
        return;
      }
    }
  };
  onopenCallback();
};

/**Send the Uint8Array data.
 *@param {Buffer} element the data packet
 */
MessageChannelTransport.prototype.send = function(element)
{
  this.connectionInfo.getPort().postMessage(element);
};

module.exports = MessageChannelTransport;
