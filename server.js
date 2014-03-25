var cluster = require('cluster');
var express = require('express');
var http    = require('http');
var net     = require('net');
var ws      = require('ws');
var files   = require('files');
var persist = require('persist');
var authenticate = require('authenticate');

var special = {
    'files' : files.server,
    'ol-c'  : authenticate
};

var processes = {
    '1' : {
        objectID : '1394488436895988200',
        host : '127.0.0.1',
        port  : 8001
    },
    '2' : {
        objectID : '1394491492339584300',
        host : '127.0.0.1',
        port  : 8002
    },
    '3' : {
        objectID : '1394481424832363300',
        host : '127.0.0.1',
        port  : 8003
    }
};

if (cluster.isMaster) {
    var hosts = {};
    var actions = {
        'get host' : function (message, worker) {
            worker.send({
                token : message.token,
                response : hosts[message.id]
            });
        }
    };
    for (var subdomain in processes) {
        var environment = processes[subdomain];
        worker = cluster.fork(environment);
        hosts[environment.objectID] = {
            host : environment.host,
            port : environment.port
        };
        worker.on('message', respond(worker));
    }
    function respond(worker) {
        return function (message) {
            var action = actions[message.action];
            action(message, worker);
        }
    }
}
else {
    var app = express();
    app.use(express.favicon(__dirname + '/static/favicon.ico'));
    app.use(function (req, res, next) {
        var subdomain = req.headers.host.split('.').shift();
        if (special[subdomain]) special[subdomain](req, res);
        else next();
    });
    app.use(express.static('./static'));
    app.listen(80);
    var HTTPserver = http.createServer(app); 
    var WSserver = new ws.Server({server : HTTPserver});
    WSserver.on('connection', persist.handleWS);
    HTTPserver.listen(80);

    //  load root object
    persist.load(process.env.objectID, {}, function (err, res) {
        if (err) console.log('error loading test object');
    });

    //  create resolver
    var waiting_responses = {};
    persist.resolve_hosts(function (id, callback) {
        var token = Math.random();
        process.send({
            'token'  : token,
            'action' : 'get host',
            'id'     : id
        });
        waiting_responses[token] = callback;
    });

    process.on('message', function (message) {
        var waiting = waiting_responses[message.token];
        if (waiting) {
            waiting(null, message.response);
            delete waiting_responses[message.token];
        }
    });

    process.on('uncaughtException', function (err) {
        //  log all the stuff leading up to this
        console.log(err.stack);
    });

    //  TODO: notify master whenever persist loads a new object
    //        so that this process can claim control

    //  persist communicates over tcp
    TCPserver = net.createServer(persist.handleTCP);
    TCPserver.listen(process.env.port);
}
