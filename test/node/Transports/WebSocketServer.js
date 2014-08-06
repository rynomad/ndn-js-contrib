var abstract = require("./Abstract.js")
var WSSServer = require("../../../src/Transports/node/WebSocketServer.js")
var assert = require("assert")
var ws = require("ws")

function WSSTest (Transport){
  describe("Listener", function(){
    it("should listen on default port", function(done){
      Transport.Listener(function(protocolKey, socket){
        assert(protocolKey == "wsServer")
        assert(socket._socket.readable && socket._socket.writable)
        done()
      })
      var c = new ws("ws://localhost:7575");
    })
  })
}

abstract(WSSServer, WSSTest)
