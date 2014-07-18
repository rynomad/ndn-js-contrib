
MessageChannelTransport.protocolKey = "messageChannel"

/**Transport Class for HTML5 MessageChannels
 *@constructor
 *@param {MessageChannel Port} port one end of an HTML MessageChannel
 *@returns {MessageChannelTransport}
 */
function MessageChannelTransport (port) {
  this.port = port
};

/**Set the event listener for incoming elements
 *@param {Object} face the ndn.Face object that this transport is attached to
 *@param {function} onopenCallback a callback to be performed once the transport is open
 */
MessageChannelTransport.prototype.connect = function(face, onopenCallback)
{
  this.elementReader = new ElementReader(face);
  var self = this;
  this.port.onmessage = function(ev) {
    console.log('RecvHandle called on local face', ev);

    if (ev.data == null || ev.data == undefined || ev.data == "") {
      console.log('INVALID ANSWER');
    }
    else if (ev.data instanceof ArrayBuffer) {
      var bytearray = new Buffer(ev.data);
      console.log(ev.data)
      console.log(bytearray)
      try {
        // Find the end of the binary XML element and call face.onReceivedElement.
        self.elementReader.onReceivedData(bytearray);
      } catch (ex) {
        console.log("NDN.ws.onmessage exception: " + ex);
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
  this.port.postMessage(element, [element]);
};

module.exports = MessageChannelTransport;
