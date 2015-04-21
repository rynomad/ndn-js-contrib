var Peer = require("peerjs")
  , Face = require("../Face.js");

function Node_peer_listen (params){
  var self  = this;
  this._servers = this._servers || [];
  if(params.protocol === "webrtc"){
    var peer = new Peer(params.id,{
      host : params.host || location.hostname
      , port : params.port || 8787
      , path : params.path || ""
    })

    peer.on('connection', function onClientPeerConnection(peerConnection){
      Face.create(new PeerConnectionTransport(peerConnection), function ClientPeerConnectionFace_onReceivedElement(element){
            self.onReceivedElement(element, face);
          })
          .then(function onClientFace(face){
            self.onInboundFace(face);
          });
    });

    this._servers.push(peer);



  } else if (params.protocol === "websocket" && window.WebSocketServer){
    var wsServer = new WebSocketServer({
      port: params.port || 8686
      , host : params.host || "0.0.0.0"
    });

    wsServer.addEventListener('request', function(req) {
      var socket = req.accept();

      Face.create(new ws_Transport(socket), function ws_client_Face_onReceivedElement(element){
            self.onReceivedElement(element, face);
          })
          .then(function onClientFace(face){
            self.onInboundFace(face);
          });
    });
  }
}
window.listen = Node_peer_listen;
module.exports = Node_peer_listen;
