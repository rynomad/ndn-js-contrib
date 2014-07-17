module.exports = function(grunt){


   var browsers = [{
        browserName: "chrome",
        version: "33",
        platform: "XP"
    }, {
      browserName: "chrome",
      version: "33",
      platform: "Linux"
    }];

  grunt.initConfig({

    jsdoc : {
      dist : {
        src: ['src/*.js'],
        options: {
          destination: 'doc'
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/node/*.js']
      }
    }


  })
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.registerTask("test", "mochaTest");
}
