var p;
self.onmessage = function(m){
    console.log(m)
    p = m.ports[0]
    p.onmessage = function(m){console.log(m); p.postMessage('pong')}
}
