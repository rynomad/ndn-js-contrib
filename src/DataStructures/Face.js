var Face = require("ndn-js/js/face.js");

Face.Create = function Face_create(transport){
  return new Promise(function Face_create_Promise(){
    if (!(transport && transport.getConnectionInfo()))
      return reject(new Error("Face.create(transport): must pass a transport"));

    var face
     ,  settings = {
          getTransport: function Face_create_getTransport(){
            return transport;
          }
          , getConnectionInfo : function Face_create_getConnectionInfo(){
            return transport.getConnectionInfo();
          }
          , onopen: function Face_create_onopen(){
            resolve(face);
          }
          , onclose: function Face_create_onclose(){
            console.log("face closed");
          }
        }

    var face = new Face(settings)

    face.transport.connect
     (face.connectionInfo, face,
      function Face_create_transport_connectCallback() {
        face.readyStatus = Face.OPENED;

        if (thisFace.onopen)
          // Call Face.onopen after success
          thisFace.onopen();
      },
      function Face_create_closeByTransportCallback() {
        thisFace.closeByTransport();
      }
    );

  });
}

Face.prototype.set_onReceivedElement = function Face_set_onReceivedElement(onReceivedElement){
  this.onReceivedElement = onReceivedElement.bind(this);
}
