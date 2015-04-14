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
    var repo = new ContentStore()
    it("should return a promise", function(done){
      repo.createNode(new ndn.Data(new ndn.Name("test/create/node")), repo)
        .then(function(node){
          done();
        })
        .catch(function(err){
          dene();
        })
    });

    it("should resolve with a nameTree node containing a ContentStore.Entry", function(done){
      repo.createNode(new ndn.Data(new ndn.Name("test/create/node/resolve")), repo)
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

    it("should resolve data insertion",function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/d/e"), "hello world")
      repo.insert(dat)
          .then(function(){
            done();
          })
          .catch(function(er){
            console.log("err????", er, er.stack)
            assert(false, er + er.stack)
          })
    })


    it("should reject if data is duplicate", function(done){
      var dat = new ndn.Data(new ndn.Name("a/b/c"), "hello world")

      repo.insert(dat).then(function(){
          assert(false, "accepted duplicate data")
        })
        .catch(function(er){
          done();
        })

    })

    after(function(done){
      repo.close()
          .then(function(){
            done();
          })
    })
  })

  describe("lookup(interest)", function(){
    var repo;

    before(function(done){
      Repository.Open("trash/test_lookup")
                .then(function(rp){
                  repo = rp;
                  done();
                })
                .catch(function(err){
                  console.log(err)
                })
    })

    it("should return a promise",function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/exact"))
      repo.lookup(interest)
        .then(function(){
          done();
        }).catch(function(){
          done();
        })
    })


    it("should resolve for inserted data", function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/exact"))
      interest.setMustBeFresh(false)
      repo.insert(new ndn.Data(new ndn.Name("test/interest/lookup/exact"), "LOOK_SUCCESS"))
          .then(function(){
            return repo.lookup(interest)
          })
          .then(function(){
            done();
          }).catch(function(er){
            console.log(er, er.stack)
            assert(false);
          })
    })

    it("should resolve rightMost", function(done){
      var right = new ndn.Data(new ndn.Name("test/interest/right/lookup/9"), "SUCCESS");
      var left = new ndn.Data(new ndn.Name("test/interest/right/lookup/1"), "FAIL");
      repo.insert(right)
        .then(function(){
          return repo.insert(left);
        })
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/right/lookup"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          return repo.lookup(interest);
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
      var exSucc = new ndn.Data(new ndn.Name("test/interest/exclude/lookup/9"), "ExFail");
      var exSucc = new ndn.Data(new ndn.Name("test/interest/exclude/lookup/8"), "ExSUCCESS");
      repo.insert(exSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/exclude/lookup"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('9')]))
          return repo.lookup(interest);
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
      repo.insert(suffSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
          interest.setChildSelector(1);
          interest.setMinSuffixComponents(5);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('9')]))
          return repo.lookup(interest);
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

    it("should reject for excluded match", function(done){
      var exSucc = new ndn.Data(new ndn.Name("test/interest/lookup/exclude/this"), "ExSUCCESS");
      repo.insert(exSucc)
        .then(function(){
          var interest = new ndn.Interest(new ndn.Name("test/interest/lookup/exclude"));
          interest.setChildSelector(1);
          interest.setMustBeFresh(false);
          interest.setExclude(new ndn.Exclude([new ndn.Name.Component('this')]))
          return repo.lookup(interest);
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
      repo.lookup(interest)
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
      repo.lookup(interest)
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
      repo.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })

    it("should reject for mustBeFresh and stale content",function(done){
      var interest = new ndn.Interest(new ndn.Name("test/interest/lookup"));
      interest.setMustBeFresh(false)
      repo.lookup(interest)
      .then(function(data){
        assert(false, "returned false match" + data.name.toUri())
      }).catch(function(er){
        done()
      })
    })

    after(function(done){
      repo.close()
          .then(function(){
            done()
          })
    })
  })
})
