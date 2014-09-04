var Interfaces = require("../../../src/DataStructures/Interfaces.js")
var Transport = require("../../../src/Transports/AbstractTransport.js")

var assert = require("assert")

var Subject = {
  handleInterest: function(element, faceID){
    assert(element.length == 5)
    assert(faceID == 0)
  }
  , handleData: this.handleInterest
}

var ndn = require("ndn-lib")
Interfaces.installNDN(ndn);
Transport.defineListener();

var int = new Interfaces(Subject)

describe("Interfaces", function(){
  it("should Install transport", function(){
    int.installTransport(Transport)
  })
  it("should create Listener", function(){
    assert(global.ListenerActive)
  })
  describe(".newFace", function(){
    it("should create newFace", function(){
      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 0)
      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 1)
      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 2)

      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 3)

      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 4)

      assert(int.newFace("_abstract",1, function(data){
        assert(data.length == 5)
      }) == 5)
    })
  })
  describe("dispatch", function(){
    it("should send", function(){
      var element = new Buffer(5)
      var sentFaces = []
      int.dispatch(element, 37, function(id){
        sentFaces.push(id);
      })
      assert(sentFaces.length == 3)
      assert(sentFaces[0] == 0)
      assert(sentFaces[1] == 2)
      assert(sentFaces[2] == 5)
    })
  })
  describe("onReceivedElement", function(){
    it("should overWrite ndn.Face def", function(){
      var inst = new ndn.Interest(new ndn.Name("test"))
      var element = inst.wireEncode()
      int.Faces[0].onReceivedElement(element);

    })
  })


})
