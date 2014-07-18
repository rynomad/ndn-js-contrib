var ndn = require('ndn-lib')
  , Transport = require('../../../../src/Transports/MessageChannel.js')
  , Transport1, Transport2, face1, face2, inst

describe('MessageChannelTransport', function(){
  it('face2.expressInterest should send bytearray for face1', function(done){
    var ms = new MessageChannel()
    , Transport1 = new Transport(ms.port1)
    , Transport2 = new Transport(ms.port2)
    , face1 = new ndn.Face({host:1, port:1, getTransport: function(){return Transport1}})
    , face2 = new ndn.Face({host:1, port:1, getTransport: function(){return Transport2}})
    , inst = new ndn.Interest(new ndn.Name("test"))
    Transport2.connect(face2, function(){})
    Transport1.connect(face1, function(){
      Transport1.elementReader.onReceivedData = function(bytearray){
        done()
      }

      face2.expressInterest(inst)
    })
  })
})

