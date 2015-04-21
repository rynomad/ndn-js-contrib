module.exports = function(grunt){

  grunt.initConfig({
    uglify: {
      build: {
        files: {"build/ndn-js-contrib.min.js":["build/ndn-js-contrib.js"]}
      }
    },
    plato: {
      options:{
        jshint: {
          curly: true,
          eqeqeq: true,
          laxcomma: true,
          laxbreak: true
        }
      },
      shadows: {
        files: {
          'plato': ['src/**/*.js']
        }
      }
    },
    browserify: {
      testDataStructures: {
        src: "test/node/DataStructures/*.js"
        , dest: "test/browser/DataStructures/suite.js"
      },
      testTransports: {
        src: "test/browser/Transports/src/*.js"
        , dest: "test/browser/Transports/suite.js"
      },
      build: {
        src: "index.js",
        dest: "build/ndn-js-contrib.js",
        options: {
          bundleOptions: {
            standalone: 'NDN'
          }
        }
      },
      buildBig: {
        src: "index.js",
        dest: "build/ndn-js-contrib.js",
        options: {
          bundleOptions: {
            standalone: 'NDN'
          }
        }
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
        tasks: ['jshint:NameTree', 'browserify:testDataStructures','mochaTest']
      },
      ContentStore: {
        files: ['src/DataStructures/ContentStore.js', 'test/node/ContentStore.js'],
        tasks: ['jshint:ContentStore', 'browserify:testDataStructures','mochaTest']
      },
      FIB: {
        files: ['src/DataStructures/FIB.js', 'test/node/FIB.js'],
        tasks: ['jshint:FIB', 'browserify:testDataStructures','mochaTest']
      },
      PIT: {
        files: ['src/DataStructures/PIT.js', 'test/node/PIT.js'],
        tasks: ['jshint:PIT', 'browserify:testDataStructures','mochaTest']
      },
      Interfaces: {
        files: ['src/DataStructures/Interfaces.js', 'test/node/Interfaces.js'],
        tasks: ['jshint:Interfaces', 'browserify:testDataStructures','mochaTest']
      },
      Transports: {
        files: ["src/Transports/*.js", 'src/Transports/*.js'],
        tasks: ['jshint:Transports', 'browserify:testTransports', 'mochaTest' ]
      },
      livereload: {
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
      Transports: ['src/Transports/**/*.js']
    },
    removelogging : {
      dist:{
        src : 'dist/src/**/*.js',
        options:{
          namespace: ["debug", "debug.debug"],
          methods: ["debug"]

        }
      }
    },
    copy:{
      toDist:{
        files:[
          {expand: true, src: ['src/**'], dest: 'dist/'}
        ]
      },
      postUg:{
        files:[
          {expand: true, src: ['dest/**'], dest: 'dist/'}
        ]
      }
    }
  })

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-plato");
  grunt.loadNpmTasks('grunt-remove-logging');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask("stripDebug", ["copy:toDist","removelogging" ])
  grunt.registerTask("build", ["stripDebug","browserify:build","uglify:build"])
  grunt.registerTask("suite", ["jshint", "browserify:testDataStructures", "browserify:testTransports", "mochaTest"])
};
