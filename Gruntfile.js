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
        files: ['src/NameTree.js', 'src/NameTreeNode.js', 'test/node/NameTree.js'],
        tasks: ['jshint:NameTree','mochaTest:NameTree'],
      },
      ContentStore: {
        files: ['src/ContentStore.js', 'test/node/ContentStore.js'],
        tasks: ['jshint:ContentStore','mochaTest:ContentStore']
      },
      FIB: {
        files: ['src/FIB.js', 'test/node/FIB.js'],
        tasks: ['jshint:FIB','mochaTest:FIB']
      },
      PIT: {
        files: ['src/PIT.js', 'test/node/PIT.js'],
        tasks: ['jshint:PIT','mochaTest:PIT']
      },
      Interfaces: {
        files: ['src/Interfaces.js', 'test/node/Interfaces.js'],
        tasks: ['jshint:Interfaces', 'mochaTest:Interfaces']
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        laxcomma: true,
        laxbreak: true
      },
      NameTree: ['src/NameTreeNode.js', 'src/NameTree.js'],
      ContentStore: ['src/ContentStore.js'],
      FIB: ['src/FIB.js'],
      PIT: ['src/PIT.js'],
      Interfaces: ['src/Interfaces.js']
    }


  })
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("test", "mochaTest");
  grunt.registerTask("hint", "jshint")
  grunt.registerTask("suite", ["hint", "test"])
}
