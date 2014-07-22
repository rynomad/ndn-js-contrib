var ElementReader = require("ndn-lib/js/encoding/element-reader.js").ElementReader;

MessageChannelTransport.protocolKey = "messageChannel";

/**Transport Class for HTML5 MessageChannels
 *@constructor
 *@param {MessageChannel_Port} port one end of an HTML MessageChannel
 *@returns {MessageChannelTransport}
 */
function MessageChannelTransport (port) {
  this.port = port;
}

/**Set the event listener for incoming elements
 *@param {Object} face the ndn.Face object that this transport is attached to
 *@param {function} onopenCallback a callback to be performed once the transport is open
 */
MessageChannelTransport.prototype.connect = function(face, onopenCallback, third)
{
  this.elementReader = new ElementReader(face);
  var self = this;
  this.port.onmessage = function(ev) {
    if (ev.data.buffer instanceof ArrayBuffer) {
      try {
        self.elementReader.onReceivedData(ev.data);
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: " + ex);
        return;
      }
    }
  };
  if (third) {third();} else {onopenCallback();}
};

/**Send the Uint8Array data.
 *@param {Buffer} element the data packet
 */
MessageChannelTransport.prototype.send = function(element)
{
  this.port.postMessage(element);
};

module.exports = MessageChannelTransport;
