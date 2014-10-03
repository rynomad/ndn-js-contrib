var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader;
var Transport = require("ndn-lib/js/transport/transport.js").Transport;
var debug = require("debug")("MessageChannelTransport");

MessageChannelTransport.protocolKey = "messageChannel";

/**Transport Class for HTML5 MessageChannels
 *@constructor
 *@param {MessageChannel_Port} port one end of an HTML MessageChannel
 *@returns {MessageChannelTransport}
 */
function MessageChannelTransport (port) {
  debug("constructor")
  Transport.call(this);
  this.connectionInfo = new MessageChannelTransport.ConnectionInfo(port);
  return this;
}


MessageChannelTransport.prototype = new Transport();
MessageChannelTransport.prototype.name = "MessageChannelTransport";

MessageChannelTransport.ConnectionInfo = function MessageChannelTransportConnectionInfo(port){
  Transport.ConnectionInfo.call(this);
  this.port = port;
};

MessageChannelTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
MessageChannelTransport.ConnectionInfo.prototype.name = "MessageChannelTransport.ConnectionInfo";

MessageChannelTransport.ConnectionInfo.prototype.getPort = function()
{
  return this.port;
};

MessageChannelTransport.ConnectionInfo.prototype.equals = function(other)
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
MessageChannelTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback, onclosedCallback)
{
  debug("connect");
  this.elementReader = new ElementReader(elementListener);
  var self = this;
  connectionInfo.getPort().onmessage = function(ev) {
    debug("onmessage called")
    if (ev.data.buffer instanceof ArrayBuffer) {
      try {
        self.elementReader.onReceivedData(new Buffer(ev.data));
      } catch (ex) {
        debug(" onmessage exception: %s", ex);
        return;
      }
    }
  };
  //elementListener.readyStatus = 2
  onopenCallback();
};

/**Send the Uint8Array data.
 *@param {Buffer} element the data packet
 */
MessageChannelTransport.prototype.send = function(element)
{
  debug("send")
  this.connectionInfo.getPort().postMessage(element);
};

module.exports = MessageChannelTransport;
