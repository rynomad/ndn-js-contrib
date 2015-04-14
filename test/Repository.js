var Repository = require("./../src/DataStructures/Repository.js")

describe("Repository",function(){
  describe(".Open(path)",function(){
    it("should return a promise", function(){
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

  })
})
