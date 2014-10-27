var abstract = require("./Abstract.js")
var WSSServer = require("../../../src/Transports/node/WebSocketServer.js")
var assert = require("assert")
var ws = require("ws")

function WSSTest (Transport){
  describe("Listener", function(){
    it("should listen on default port", function(done){
      Transport.Listener({
        newFace: function(){
          done();
        }
      })
      var c = new ws("ws://localhost:8585");
    })
  })
}

abstract(WSSServer, WSSTest)
