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
      },
      testTransports: {
        src: "test/browser/Transports/src/*.js"
        , dest: "test/browser/Transports/suite.js"
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
      suite: {
        options: {
          reporter: 'spec'
          ,clearRequireCache: true
        },
        src: ["test/node/suite.js"]
      },
    },
    watch: {
      NameTree: {
        files: ['src/DataStructures/NameTree.js', 'src/DataStructures/NameTreeNode.js', 'test/node/NameTree.js'],
        tasks: ['jshint:NameTree', 'browserify:testDataStructures','mochaTest:DataStructures']
      },
      ContentStore: {
        files: ['src/DataStructures/ContentStore.js', 'test/node/ContentStore.js'],
        tasks: ['jshint:ContentStore', 'browserify:testDataStructures','mochaTest:DataStructures']
      },
      FIB: {
        files: ['src/DataStructures/FIB.js', 'test/node/FIB.js'],
        tasks: ['jshint:FIB', 'browserify:testDataStructures','mochaTest:DataStructures']
      },
      PIT: {
        files: ['src/DataStructures/PIT.js', 'test/node/PIT.js'],
        tasks: ['jshint:PIT', 'browserify:testDataStructures','mochaTest:DataStructures']
      },
      Interfaces: {
        files: ['src/DataStructures/Interfaces.js', 'test/node/Interfaces.js'],
        tasks: ['jshint:Interfaces', 'browserify:testDataStructures','mochaTest:DataStructures']
      },
      Transports: {
        files: ["src/Transports/*.js", 'src/Transports/*.js'],
        tasks: ['jshint:Transports', 'browserify:testTransports' ]
      },
      livereload: {
        // Here we watch the files the sass task will compile to
        // These files are sent to the live reload server after sass compiles to them
        options: { livereload: true },
        files: ['test/browser/**/*.js'],
      },
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
      Interfaces: ['src/DataStructures/Interfaces.js'],
      Transports: ['src/Transports/*.js']
    }


  })
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask("brow", ["browserify:testDataStructures"])
  grunt.registerTask("test", "mochaTest");
  grunt.registerTask("hint", "jshint")
  grunt.registerTask("suite", ["hint", "brow", "test"])
}
