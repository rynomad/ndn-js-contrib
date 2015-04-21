var WebSocket = require("ws");
var PeerServer = require("peer").PeerServer;

function Node_listen (params){
  var self  = this;
  if(params.protocol === "websocket"){
    this._servers.push(new WebSocket.Server({
      port : params.ws.port || (params.http || params.https) ? undefined : 8686
      , server : params.https || params.http
      , path : params.path
    }, function onClientWebsocket(socket){
      Face.create(new ws_Transport(socket), function ws_client_Face_onReceivedElement(element){
            self.onReceivedElement(element, face);
          })
          .then(function onClientFace(face){
            self.onInboundFace(face);
          });
    }));
  } else if (params.protocol === "webrtc"){
    var peerServer = new PeerServer({
      port : params.port
      , path : params.path
      , ssl : params.ssl
    });
    this._servers.push(peerServer);

  } else if (params.protocol === "tcp"){

  } else if (params.protocol === "udp"){

  }
}

module.exports = Node_listen;
