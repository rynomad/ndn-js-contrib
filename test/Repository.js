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
})
