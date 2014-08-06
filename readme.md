NDN-Contrib - Expanded Class Library on top of NDN-js
=================

[NDN-js](https://github.com/named-data/ndn-js) offers the common client Named Data Networking library in pure javascript. This is an expansion upon that work, offering a modular set of javascript 'classes' for building NDN enabled apps in Node.js, the browser, and even exciting runtimes like breach and atom-shell.

* DataStructures 
  * [NameTree](http://rynomad.github.io/ndn-javascript-data-structures/doc/NameTree.html) 
  * [ContentStore](http://rynomad.github.io/ndn-javascript-data-structures/doc/ContentStore.html) with modular entries for caching, database indexing, etc.
  * [PIT](http://rynomad.github.io/ndn-javascript-data-structures/doc/PIT.html) - Pending Interest Table with modular entry options (callbacks or integer IDs)
  * [FIB](http://rynomad.github.io/ndn-javascript-data-structures/doc/FIB.html) - Forwarding Interest Base
  * [Interfaces](http://rynomad.github.io/ndn-javascript-data-structures/doc/Interfaces.html) - Interface manager accepting any combination of transports

* Transports - 
  * Node
    * [TCP Server](http://rynomad.github.io/ndn-javascript-data-structures/doc/TCPServerTransport.html)
    * [WebSocket Server](http://rynomad.github.io/ndn-javascript-data-structures/doc/WebSocketServerTransport.html)   
  * Browser
    * [HTML5 MessageChannel](http://rynomad.github.io/ndn-javascript-data-structures/doc/MessageChannelTransport.html)
    * WebRTC - prototyped, coming soon
  * Other
    * Telehash, atom-shell IPC, and more coming soon... 

Usage
-----
simply require("ndn-contrib") in your project (use browserify for browser projects)

    var ndn = require("ndn-contrib");

all the classes are now attached to the ndn object (including ndn-js @ ndn.ndn), and are ready to go...

    var myInterfaces = new ndn.Interfaces(/*Subject*/)
    ndn.WebSocketServer.defineListener();
    myInterface.installProtocol(ndn.WebSocketServer);

now you have a websocket server accepting incoming connections and handing interest and data packets to your subject! For more, detail see the full [documentation](http://rynomad.github.io/ndn-javascript-data-structures/doc/index.html).

You can also include just part of the library by doing something like

    var ndn = require("ndn-lib");
    var Interfaces = require("ndn-contrib/src/DataStructures/Interfaces.js");
    Interfaces.installNDN(ndn); /** This is done for you if you require("ndn-contrib"),
                                 * it's a safety measure to avoid 'instanceof' bugs.
                                 */

Contributing
-----------

    grunt watch // do everything automatically while coding
    grunt suite // run all the tests
    grunt jsdoc // generate documentation

Bug reports and pull requests welcome! lint, doc, and test are all registered tasks in Gruntfile.js, and will run automatically for you when you use grunt watch. Browser tests are also assembled via grunt in the test/browser directory, and have a livereload script that will re-compile and run them when watch is running. Happy hacking!

License
-------
LGPL (vTBD)

Contact
-------
Ryan Bennett, Colorado State University. nomad.ry@gmail.com
