var assert = require('assert')

module.exports = function(Transport, moveOn){
var listener ;
  describe("Transport", function(){
    it("should have .protocolKey String", function(){
      assert(typeof Transport.protocolKey === "string", "Transport.protocolKey must be a string")
    })
    describe(".defineListener", function(){
      it("may or may not be present", function(){
        assert((Transport.defineListener && !Transport.Listener) || (!Transport.defineListener && !Transport.Listener))
        if (Transport.defineListener){
          listener = true;
        }
      })
      it("should define Listener with defaults", function(){
        if (listener){
          Transport.defineListener()
          assert(Transport.Listener)
        }
      })
    })
  })
  moveOn(Transport)
}

