var express = require('express');
var http    = require('http');
var net     = require('net');
var ws      = require('ws');
var files   = require('files');
var persist = require('persist');
var cluster = require('cluster');
var haproxy = require('haproxy');

var processes = {
    '1' : {
        objectID : '1394488436895988200',
        TCPport  : 8888,
        HTTPport : 8001
    },
    '2' : {
        objectID : '1394491492339584300',
        TCPport  : 8888,
        HTTPport : 8002
        
    },
    '3' : {
        objectID : '1394481424832363300',
        TCPport  : 8888,
        HTTPport : 8003
    }
};

if (cluster.isMaster) {
    var proxy = new haproxy('/tmp/haproxy.sock', {
        config : __dirname + '/haproxy.cfg'
    });
    proxy.stop(true);
    proxy.start(function (err) {
        if (err) console.log('on start', err);
    });
    proxy.verify(function (err, working) {
        if (err) console.log(err);
        else     console.log('working', working);
    })
    //  serve static files
    for (var domain in processes) {
        cluster.fork(processes[domain]);
    }
    cluster.on('listening', function(worker, address) {
    });
    //  TODO: add new subdomains for users
    setTimeout(function () {
        proxy.reload(function (err) {
            if (err) console.log(err);
            else console.log('reloaded');
        });
    }, 10000)
}
else {
    var app = express();
    app.use(express.favicon(__dirname + '/static/favicon.ico'));
    app.use('/files', files.server);
    app.use(express.static('./static'));
    var HTTPserver = http.createServer(app);
    HTTPserver.listen(process.env.HTTPport);

    //  load test object
    persist.load(process.env.objectID, {}, function (err, res) {
        if (err) console.log('error loading test object');
    });

    //  test resolver
    persist.resolve_hosts(function (id, callback) {
        callback(null, process.env.hostname + ':' + process.env.TCPport);
    });

    //  persist communicates over websockets
    var WSserver = new ws.Server({server : HTTPserver});
    WSserver.on('connection', persist.handleWS);

    //  persist communicates over tcp
    var TCPserver = net.createServer(persist.handleTCP);
    TCPserver.listen(process.env.TCPport);
}
