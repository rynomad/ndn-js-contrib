/**An Abstract transport class for unit testing the {@link Interfaces} data structure and a starting point for implimenting new Transports
 *@constructor
 */

var Transport = require("ndn-lib/js/transport/transport.js").Transport;

function AbstractTransport(sendCb)
{
  Transport.call(this);

  this.sendCb = sendCb;
  return this;
}

AbstractTransport.prototype = new Transport();
AbstractTransport.prototype.name = "_abstract";

/**Define a connection listener for the {@link Interfaces} module. This Class method must be called before installing the class into Interfaces (if you want a Listener)
 */
AbstractTransport.defineListener = function(){

  this.Listener = function (newFace) {
    global.ListenerActive = true;
    this.call = function(){

      newFace(AbstractTransport.prototype.name, function(data){
      });
    };
  };
};

AbstractTransport.ConnectionInfo = function AbstractChannelTransportConnectionInfo(port){
  //console.log(Transport);
  Transport.ConnectionInfo.call(this);
  this.port = port;
};

AbstractTransport.ConnectionInfo.prototype = new Transport.ConnectionInfo();
AbstractTransport.ConnectionInfo.prototype.name = "_abstract.ConnectionInfo";

AbstractTransport.prototype.connect = function(connectionInfo, elementListener, onopenCallback)
{
  onopenCallback();
  return this;
};

AbstractTransport.prototype.send = function(/*Buffer*/ data)
{
  console.log(data);
};

AbstractTransport.prototype.close = function()
{
};

module.exports = AbstractTransport;
