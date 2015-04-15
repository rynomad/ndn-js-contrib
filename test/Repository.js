var Repository = require("./../src/DataStructures/Repository.js")
var assert = require("assert");
describe("Repository",function(){


  describe("Repository.Open(path)",function(){
    it("should return a promise", function(done){
      Repository.Open("trash/open_first")
                .then(function(repo){
                  return repo.close();
                })
                .then(function(repo){
                  return repo.destroy();
                }).then(function(){
                  done();
                }).catch(function(){
                  done();
                });
    })

    it("should resolve with the repo object", function(done){
      Repository.Open("trash/open_second")
                .then(function(repo){
                  assert(repo.insert === Repository.prototype.insert, "triple equals lol");
                  return repo;
                })
                .then(function(repo){
                  return repo.close()
                }).then(function(repo){
                  return repo.destroy();
                }).then(function(){
                  done();
                })
                .catch(function(err){
                  console.log(err)

                });
    })

    it("should reject if repo open", function(done){
      var repo;
      Repository.Open("trash/open_fail")
                .then(function(rep){
                  repo = rep;
                  return Repository.Open("trash/open_fail")
                })
                .then(function(repo){
                  assert(false)
                })
                .catch(function(err){
                  return repo.close()
                             .then(function(){
                               repo.destroy()
                             });
                }).then(function(){
                  done();
                });
    })
  })





  describe("destroy()", function(){
    var repo;
    before(function(done){
      Repository.Open("trash/test_dest")
                .then(function(re){
                  repo = re;
                  done();
                })
                .catch(function(er){
                  console.log(er)
                  //done();
                })
    })

    it("should resolve only after close if not closed a promise", function(done){
      console.log(repo)
      repo.destroy()
          .then(function(){
            assert(false);
          })
          .catch(function(er){
            return repo.close();
          }).then(function(){
            return repo.destroy();
          }).then(function(){
            done();
          }).catch(function(){
            assert(false)
          })
    })
  })



  describe("createNode(data, contentStore)",function(){
    var repo;
    before(function(done){
      Repository.Open("trash/test_createNode")
                .then(function(re){
                  repo = re;
                  done()
                })
                .catch(function(err){
                  console.log(err);
                })
    });

    it("should return a promise", function(done){
      repo.createNode(new ndn.Data(new ndn.Name("test/create/node"), "content"), repo)
        .then(function(node){
          done();
        })
        .catch(function(err){
          dene();
        })
    });

    it("should resolve with a nameTree node containing a Repository.Entry", function(done){
      repo.createNode(new ndn.Data(new ndn.Name("test/create/node/resolve"), "content"), repo)
        .then(function(node){
          assert(node.getItem() instanceof Repository.Entry)
          done()
        })
        .catch(function(err){
          throw err
        })
    });

    after(function(done){
      repo.close()
          .then(function(){
            return repo.destroy()
          })
          .then(function(){
            done();
          })
          .catch(function(er){
            console.log(er)
          })
    })
  })

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
            return repo.destroy();
          }).then(function(){
            done();
          })
    })
  })

  describe("remove(Entry)",function(){

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

    after(function(done){
      repo.close()
          .then(function(){
            return repo.destroy();
          }).then(function(){
            done();
          })
    })

  })

  describe("Entry", function(){

var repo;
before(function(done){
  Repository.Open("trash/test_entry")
            .then(function(r){
              repo = r;
              done();

            }).catch(function(err){
              console.log(err)
            })
})
    describe("construct and getData()",function(){

      it("should insert and retrieve it's own packet",function(done){
        this.timeout(5000)
        repo.createNode(new ndn.Data(new ndn.Name("test/insert/delete"), "hello world"), repo)
        .then(function(entry){
          console.log(entry.getItem())
          return entry.getItem().getData();
        }).then(function(data){
          assert(data.content.toString() === "hello world", "something went wrong")
          done();
        }).catch(function(er){
          console.log(err)
        })
      })




    })

    describe("delete()", function(){
      it("should remove the packet from the db", function(done){
        var node
        repo.createNode(new ndn.Data(new ndn.Name("delete/data"), "goodbye world") ).then(function(node){
          return node.getItem().delete();
        }).then(function(entry){

            entry._repository._dataDB.createKeyStream()
                .on("data",function( data){
                  assert(data.substr(0, 7) !== "/delete")
                })
                .on("end",function(err){
                  done()
                })
        })
      })
    })

    describe("fulfillsInterest(interest)",function(){
      it("should return true for exact match",function(done){
        repo.createNode(new ndn.Data(new ndn.Name("test/repo/fulfills/interest"), "goodbye world") ).then(function(node){

          assert(node.getItem().fulfillsInterest(new ndn.Interest(new ndn.Name("test/repo/fulfills/interest"))), "not matching");
          done();
        })
      })

    })

    after(function(done){
      repo.close()
          .then(function(repo){
            repo.destroy();
            done()
          })
    })
  })


})
