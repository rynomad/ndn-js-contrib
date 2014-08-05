var ndn = require('ndn-lib')
  , Transport = require('../../../../src/Transports/MessageChannel.js')
  , Transport1, Transport2, face1, face2, inst
  , Abstract = require("../../../node/Transports/Abstract.js");

function msSpec (Transport){
  describe('MessageChannelTransport', function(){
    it('face2.expressInterest should send bytearray for face1', function(done){
      var ms = new MessageChannel()
      , Transport1 = new Transport(ms.port1)
      , Transport2 = new Transport(ms.port2)
      , face1 = new ndn.Face(Transport1, Transport1.connectionInfo)
      , face2 = new ndn.Face(Transport2, Transport2.connectionInfo)
      , inst = new ndn.Interest(new ndn.Name("test"))
      console.log(Transport1)
      Transport2.connect(Transport2.connectionInfo, face2, function(){})
      Transport1.connect(Transport1.connectionInfo, face1, function(){
        Transport1.elementReader.onReceivedData = function(bytearray){
          done()
        }

        face2.expressInterest(inst)
      })
    })
  })
}

Abstract(Transport, msSpec);
