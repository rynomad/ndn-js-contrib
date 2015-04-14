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
                })
                .catch(function(err){
                  console.log(err)

                })
    })

  })
})
