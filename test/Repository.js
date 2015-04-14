var Repository = require("./../src/DataStructures/Repository.js")
var assert = require("assert");
describe("Repository",function(){
  describe(".Open(path)",function(){
    it("should return a promise", function(done){
      Repository.Open("trash")
                .then(function(repo){
                  return repo.close();
                })
                .then(function(){
                  done();
                })
                .catch(function(err){
                  done();
                })
    })

    it("should resolve with the repo object", function(done){
      Repository.Open("trash")
                .then(function(repo){
                  assert(repo.insert === Repository.prototype.insert, "triple equals lol");
                  done()
                  return repo;
                })
                .catch(function(err){
                  console.log(err)

                })
                .then(function(repo){
                  return repo.close()
                })
    })

    it("should reject if repo open", function(done){
      Repository.Open("trash/openfail")
                .then(function(repo){
                  return Repository.Open("trash/openfail")
                })
                .then(function(repo){
                  assert(false)
                })
                .catch(function(err){
                  assert(err)
                  done();
                })
    })

  })

  /**
  describe("createNode(data, contentStore)",function(){
    var cs = new ContentStore()
    it("should return a promise", function(done){
      cs.createNode(new ndn.Data(new ndn.Name("test/create/node")), cs)
        .then(function(node){
          done();
        })
        .catch(function(err){
          dene();
        })
    });

    it("should resolve with a nameTree node containing a ContentStore.Entry", function(done){
      cs.createNode(new ndn.Data(new ndn.Name("test/create/node/resolve")), cs)
        .then(function(node){
          assert(node.getItem() instanceof ContentStore.Entry)
          done()
        })
        .catch(function(err){
          throw err
        })
    });
  })
  */
  describe("insert(data)",function(){
    var repo ;
    before(function(done){
      Repository.Open("trash/test_insert")
                .then(function(rp){
                  repo = rp;
                  done();
                })
                .catch(function(err){
                  console.log(err)
                })
    })

    it("should return a promise",function(done){
      repo.insert(new ndn.Data(new ndn.Name("a/b/c"), "hello world"))
          .then(function(){
            done();
          }).catch(function(){
            done();
          })

    })
    /**
    it("should reject usnigned data",function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      cs.insert(dat).then(function(){
          assert(false)
        })
        .catch(function(er){
          done()
        })
    })
    */

    it("should reject if data is duplicate", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/c"), "hello world")

      repo.insert(dat).then(function(){
          assert(false, "accepted duplicate data")
        })
        .catch(function(er){
          done();
        })

    })
    /**
    it("should resolve for signed data", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/y"), "hello world")
      cs.insert(dat).then(function(){
          done();
        })
        .catch(function(er){
          console.log(er.stack)
          assert(false);
        })

    })

    it("should mark as stale after freshnessMilliseconds", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      dat.getMetaInfo().setFreshnessPeriod(500)

      cs.insert(dat)
        .then(function(entr){
          entr.onDataStale = function(){
            done();
          }
        })
        .catch(function(err){
          console.log(err, err.stack)
          throw err
        })

    })

    it("should trigger ContentStore.onMaxPackets if max packets reached", function(done){

      cs.onMaxPackets = function(){
        done();
      }

      cs.setMaxPackets(10);
      function recurse (count){
        if (cs._packetCount < cs.getMaxPackets())
          return cs.insert(new ndn.Data(new ndn.Name("test/packet/max/" + cs._packetCount), "test"))
                   .then(recurse)
      }
      cs.insert(new ndn.Data(new ndn.Name("test/packet/max"), "test"))
        .then(recurse)
    })
    */
    after(function(done){
      repo.close()
          .then(function(){
            done();
          })
    })
  })
})
