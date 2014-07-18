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
    browserify: {
      testDataStructures: {
        src: "test/node/DataStructures/*.js"
        , dest: "test/browser/DataStructures/suite.js"
      }
    },
    jsdoc : {
      dist : {
        src: ['src/**/*.js'],
        options: {
          destination: 'doc'
        }
      }
    },
    mochaTest: {
      NameTree: {
        options: {
          reporter: 'spec'
          ,clearRequireCache: true
        },
        src: ['test/node/NameTree.js']
      },
      ContentStore: {
        options: {
          reporter: 'spec'
          , clearRequireCache: true
        },
        src: ['test/node/ContentStore.js']
      },
      PIT: {
        options: {
          reporter: 'spec'
          , clearRequireCache: true
        },
        src: ['test/node/PIT.js']
      },
      FIB: {
        options: {
          reporter: 'spec'
          , clearRequireCache: true
        },
        src: ['test/node/FIB.js']
      }
    },
    watch: {
      NameTree: {
        files: ['src/DataStructures/NameTree.js', 'src/DataStructures/NameTreeNode.js', 'test/node/NameTree.js'],
        tasks: ['jshint:NameTree','mochaTest:NameTree', 'browserify:testDataStructures'],
      },
      ContentStore: {
        files: ['src/DataStructures/ContentStore.js', 'test/node/ContentStore.js'],
        tasks: ['jshint:ContentStore','mochaTest:ContentStore', 'browserify:testDataStructures']
      },
      FIB: {
        files: ['src/DataStructures/FIB.js', 'test/node/FIB.js'],
        tasks: ['jshint:FIB','mochaTest:FIB', 'browserify:testDataStructures']
      },
      PIT: {
        files: ['src/DataStructures/PIT.js', 'test/node/PIT.js'],
        tasks: ['jshint:PIT','mochaTest:PIT', 'browserify:testDataStructures']
      },
      Interfaces: {
        files: ['src/DataStructures/Interfaces.js', 'test/node/Interfaces.js'],
        tasks: ['jshint:Interfaces', 'mochaTest:Interfaces' , 'browserify:testDataStructures']
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        laxcomma: true,
        laxbreak: true
      },
      NameTree: ['src/DataStructures/NameTreeNode.js', 'src/DataStructures/NameTree.js'],
      ContentStore: ['src/DataStructures/ContentStore.js'],
      FIB: ['src/DataStructures/FIB.js'],
      PIT: ['src/DataStructures/PIT.js'],
      Interfaces: ['src/DataStructures/Interfaces.js']
    }


  })
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask("bro", ["browserify:testDataStructures"])
  grunt.registerTask("test", "mochaTest");
  grunt.registerTask("hint", "jshint")
  grunt.registerTask("suite", ["hint", "test"])
}
