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
        files: ['src/NameTree.js', 'src/NameTreeNode.js'],
        tasks: ['mochaTest:NameTree']
      },
      ContentStore: {
        files: ['src/ContentStore.js'],
        tasks: ['mochaTest:ContentStore']
      },
      FIB: {
        files: ['src/FIB.js'],
        tasks: ['mochaTest:FIB']
      },
      ContentStore: {
        files: ['src/PIT.js'],
        tasks: ['mochaTest:PIT']
      },
    }


  })
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.registerTask("test", "mochaTest");
}
