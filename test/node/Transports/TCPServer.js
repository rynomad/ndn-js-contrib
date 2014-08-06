var abstract = require("./Abstract.js")
var tcpServer = require("../../../src/Transports/node/TCPServer.js")
var assert = require("assert")
var net = require("net")

function TCPTest (Transport){
  describe("Listener", function(){
    it("should listen on default port", function(done){
      Transport.Listener(function(protocolKey, socket){
        assert(protocolKey == "tcpServer")
        assert(socket.readable && socket.writable)
        done()
      })
      var c = net.connect({port: 7474}, function(){
        assert(c)
      })
    })
  })
}

abstract(tcpServer, TCPTest)
