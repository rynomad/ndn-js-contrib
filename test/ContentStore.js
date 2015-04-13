var ContentStore = require("../src/DataStructures/ContentStore.js")
var assert = require("assert");
ndn = require('ndn-js');
var keyChain = require("./setup/key-chain.js").keyChain
var certificateName = require("./setup/key-chain.js").certificateName



describe("ContentStore", function(){
  describe("setMaxPackets(int)",function(){
    it('should be returned by .getMaxPackets()',function(){
      var cs = new ContentStore()
      cs.setMaxPackets(100)
      assert(cs.getMaxPackets() === 100)
    })
  })

  describe("createNode(data, contentStore)",function(){
    var cs = new ContentStore()
    it("should return a promise", function(done){
      cs.createNode(new ndn.Data(new ndn.Name("test/create/node")), cs)
        .then(function(node){
          assert(node.getItem() instanceof ContentStore.Entry)
          done()
        })
        .catch(function(err){
          throw err
        })
    });

    it("should resolve with a nameTree node containing a ContentStore.Entry", function(done){
      done()
    });
  })

  describe("insert(data)",function(){
    var cs = new ContentStore();
    before(function(){
      cs.setKeyChain(keyChain)
    })

    it("should return a promise",function(done){
      cs.insert(new ndn.Data(new ndn.Name("a/b/c"), "hello world"))
        .then(function(){
          done()
        }).catch(function(){
          done()
        })

    })

    it("should reject usnigned data",function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      cs.insert(dat).then(function(){
          assert(false)
        })
        .catch(function(er){
          done()
        })
    })

    it("should reject if data is duplicate", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/c"), "hello world")
      keyChain.sign(dat, certificateName, function (){
        cs.insert(dat).then(function(){
            return cs.insert(dat)
          })
          .catch(function(er){
            done();
          })
      } );
    })

    it("should resolve for signed data", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      keyChain.sign(dat, certificateName, function (){
        cs.insert(dat).then(function(){
            done();
          })
          .catch(function(er){
            console.log(er.stack)
            assert(false);
          })
      });
    })

    it("should mark as stale after freshnessMilliseconds", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      dat.getMetaInfo().setFreshnessPeriod(10)
      keyChain.sign(dat, certificateName, function (){
        cs.insert(dat)
          .then(function(entry){
            entry.onDataStale = function(){
              done();
            }
          })
      });
    })

    it("should trigger ContentStore.onMaxPackets if max packets reached", function(done){
      cs.setKeyChain(null)
      cs.onMaxPackets = function(){
        done();
      }

      cs.setMaxPackets(10);
      function recurse (count){
        console.log("count", count)
        if (count < cs.getMaxPackets())
        return cs.insert(new ndn.Data(new ndn.Name("test/packet/max" + count), "test"))
                 .then(recurse)
      }
      cs.insert(new ndn.Data(new ndn.Name("test/packet/max"), "test"))
        .then(recurse)
    })
  })

  describe(".remove(node)",function(){
    var cs = new ContentStore();
    var data
    before(function(){
      data = new ndn.Data(new ndn.Name("a/a/a/a/a/a/a/"), "fail")

    })
    it('should remove the packet',function(done){
      cs.insert(data)
        .then(function(){
          return cs.createNode(data, cs)
        })
        .then(function(node){
          cs.removeNode(node);
          var interest = new ndn.Interest(new ndn.Name("a"));
          interest.setMustBeFresh(false);
          return cs.lookup(interest)

        })
        .then(function(data){
          assert(false, "should have no data")
        })
        .catch(function(er){
          done();
        });


    })

    it('should decrement the packetCount', function(done){

      var cs = new ContentStore();
      assert(cs._packetCount === 0, "initial packetCount nonzero: " + cs._packetCount)
      cs.insert(data)
        .then(function(){
          assert(cs._packetCount === 1, "packetCount not incremented" + cs._packetCount)
          return cs.createNode(data, cs);
        })
        .then(function(node){
          cs.removeNode(node)
          assert(cs._packetCount === 0, "packetCount not decrimented" + cs._packetCount)
          done()
        }).catch(function(er){
          console.log(er)
          throw er
        })
    })
  })

  describe("lookup(Interest)",function(){
    var cs = new ContentStore();
    before(function(done){
      cs.insert(new ndn.Data(new ndn.Name("test/interest/lookup/2"), "SUCCESS"))
        .then(function(){
          done()
        })
    })
    it("should return a promise",function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"))
      cs.lookup(interest)
        .then(function(){
          done();
        }).catch(function(){
          done();
        })
    })


    it("should resolve for inserted data", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"))
      interest.setMustBeFresh(false)
      cs.lookup(interest)
        .then(function(){
          done();
        }).catch(function(er){
          console.log(er, er.stack)
          assert(false);
        })
    })

    it("should resolve rightMost", function(done){
      var right = new ndn.Data(new ndn.Name("test/interest/lookup/9"), "SUCCESS");
      var left = new ndn.Data(new ndn.Name("test/interest/lookup/1"), "FAIL");
      cs.insert(right)
        .then(function(){
          return cs.insert(left);
        })
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          return cs.lookup(interest);
        })
        .then(function(data){
          if (data.content.toString() == "SUCCESS")
            done()
          else
            assert(false, "did not return the right data");
        }).catch(function(er){
          assert(false, er + er.stack)
        })

    })


    it("should resolve rightMost with Exclude", function(done){
      var exSucc = new ndn.Data(new ndn.Name("test/interest/lookup/8"), "ExSUCCESS");
      cs.insert(exSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('9')]))
          return cs.lookup(interest);
        })
        .then(function(data){
          if (data.content.toString() == "ExSUCCESS")
            done()
          else
            assert(false, "did not exclude properly" + data.name.toUri())
        }).catch(function(er){
          console.log(er, er.stack)
          assert(false);
        })
    })

    it("should resolve rightMost with minSuffix", function(done){
      var suffSucc = new ndn.Data(new ndn.Name("test/interest/lookup/8/long/suffix/comp"), "SuffSUCCESS");
      cs.insert(suffSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
          interest.setChildSelector(1);
          interest.setMinSuffixComponents(5);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('9')]))
          return cs.lookup(interest);
        })
        .then(function(data){
          if (data.content.toString() == "SuffSUCCESS")
            done()
          else
            assert(false, "did not exclude properly" + data.name.toUri())
        }).catch(function(er){
          console.log(er, er.stack)
          assert(false);
        })
    })

    it("should resolve for fresh data", function(done){
      var data = new ndn.Data(new ndn.Name("test/interest/lookup/fresh/success"), "freshSUCCESS")
      var dataf = new ndn.Data(new ndn.Name("test/interest/lookup/fresh/fail"), "freshFAIL")
      dataf.getMetaInfo().setFreshnessPeriod(1);
      data.getMetaInfo().setFreshnessPeriod(5000);
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/fresh"))
      interest.setMustBeFresh(true)
      cs.insert(dataf)
        .then(function(){
          return cs.insert(data)
        }).then(function(){
          setTimeout(function(){
            cs.lookup(interest).then(function(dat){
              console.log(dat.name.toUri(), data.name.toUri())
              assert(dat.name.equals(data.name), "return not fresh data")
              done();
            }).catch(function(er){
              console.log(er, er.stack)
              assert(false);
            })
          }, 100)
        })

    })

    it("should reject for excluded match", function(done){
      var exSucc = new ndn.Data(new ndn.Name("test/interest/lookup/exclude/this"), "ExSUCCESS");
      cs.insert(exSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/exclude"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('this')]))
          return cs.lookup(interest);
        })
        .then(function(data){
          assert(false, "did not exclude properly" + data.name.toUri())
        }).catch(function(er){
          done()
        })
    })

    it("should reject for no match", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/no/data"));
      interest.setMustBeFresh(false)
      cs.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })

    it("should reject for minSuffix > tree height", function(done){
      var interest = new ndn.Interest(new ndn.Name(""));
      interest.setMinSuffixComponents(100)
      interest.setMustBeFresh(false)
      cs.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })

    it("should reject for maxSuffix < shortest data", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
      interest.setMaxSuffixComponents(0)
      interest.setMustBeFresh(false)
      cs.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })

    it("should reject for mustBeFresh and stale content",function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
      interest.setMustBeFresh(false)
      cs.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })
  })



  describe(".onMaxPackets()",function(){

    
  })

})
