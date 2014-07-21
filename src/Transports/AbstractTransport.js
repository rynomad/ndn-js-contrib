/**An Abstract transport class for unit testing the {@link Interfaces} data structure and a starting point for implimenting new Transports
 *@constructor
 */
function AbstractTransport(sendCb)
{
  this.sendCb = sendCb
  return this;
};

AbstractTransport.protocolKey = "_abstract"

/**Define a connection listener for the {@link Interfaces} module. This Class method must be called before installing the class into Interfaces (if you want a Listener)
 */
AbstractTransport.defineListener = function(){

  this.Listener = function (newFace) {
    global.ListenerActive = true
    this.call = function(){

      newFace(AbstractTransport.protocolKey, function(data){
        assert(true)
      })
    }
  };
};

AbstractTransport.prototype.connect = function(face, onopenCallback)
{
  return this;
};

AbstractTransport.prototype.send = function(/*Buffer*/ data)
{
  this.sendCb(data)
};

AbstractTransport.prototype.close = function()
{
};

module.exports = AbstractTransport
