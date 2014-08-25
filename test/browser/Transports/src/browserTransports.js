var ndn = require('ndn-lib')
  , Transport = require('../../../../src/Transports/browser/MessageChannel.js')
  , DTransport = require("../../../../src/Transports/browser/WebRTCDataChannel.js")
  , Transport1, Transport2, face1, face2, inst, localConnection, remotePeerConnection, sendChannel, receiveChannel
  , Abstract = require("../../../node/Transports/Abstract.js");

function trace(msg){console.log(msg)}

var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

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
      face1.onReceivedElement = function(bytearray){

       done()
      }
      face1.transport.connect(face1.transport.connectionInfo, face1, function(){
        face2.expressInterest(inst);
      })


    })
  })
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState == 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}

function gotDescription1(desc) {
  localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  remotePeerConnection.setRemoteDescription(desc);
  remotePeerConnection.createAnswer(gotDescription2, onCreateSessionDescriptionError);
}

function gotDescription2(desc) {
  remotePeerConnection.setLocalDescription(desc);
  trace('Answer from remotePeerConnection \n' + desc.sdp);
  localConnection.setRemoteDescription(desc);
}

function iceCallback1(event) {
  trace('local ice callback');
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(event.candidate,
                        onAddIceCandidateSuccess, onAddIceCandidateError);
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function iceCallback2(event) {
  trace('remote ice callback');
  if (event.candidate) {
    localConnection.addIceCandidate(event.candidate,
                        onAddIceCandidateSuccess, onAddIceCandidateError);
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function createConnection() {
  var servers = null;
  localConnection = new RTCPeerConnection(servers);
  trace('Created local peer connection object localConnection');

  try {
    // Data Channel api supported from Chrome M25.
    // You might need to start chrome with  --enable-data-channels flag.
    sendChannel = localConnection.createDataChannel('sendDataChannel');
    trace('Created send data channel');
  } catch (e) {
    alert('Failed to create data channel. ' +
          'You need Chrome M25 or later with --enable-data-channels flag');
    trace('Create Data channel failed with exception: ' + e.message);
  }
  localConnection.onicecandidate = iceCallback1;

  remotePeerConnection = new RTCPeerConnection(servers);
  trace('Created remote peer connection object remotePeerConnection');

  remotePeerConnection.onicecandidate = iceCallback2;
  remotePeerConnection.ondatachannel = receiveChannelCallback;

  localConnection.createOffer(gotDescription1, onCreateSessionDescriptionError);
}

createConnection();

function dcSpec (Transport){
  describe('DataChannelTransport', function(){
    it('face2.expressInterest should send bytearray for face1', function(done){
      this.timeout(10000)
      function waiter (){
        console.log("channels defined????", sendChannel, receiveChannel)
        if (sendChannel && receiveChannel){

          var Transport1 = new Transport(sendChannel)
          , Transport2 = new Transport(receiveChannel)
          , face1 = new ndn.Face(Transport1, Transport1.connectionInfo)
          , face2 = new ndn.Face(Transport2, Transport2.connectionInfo)
          , inst = new ndn.Interest(new ndn.Name("test"))
          console.log(Transport1)
          try{
          face1.onReceivedElement = function(bytearray){

            done()
          }
          face1.transport.connect(face1.transport.connectionInfo, face1, function(){
            console.log("face1 connect");
            face2.expressInterest(inst);
          })
          } catch(e){
            console.log("error:", e)
          }

        } else {
          setTimeout(waiter, 1000)
        }
      }
      waiter();

    })

  })
};

Abstract(Transport, msSpec);
Abstract(DTransport, dcSpec);
