var cluster = require('cluster');
var express = require('express');
var http    = require('http');
var net     = require('net');
var ws      = require('ws');
var files   = require('files');
var persist = require('persist');
var authenticate = require('authenticate');
var fs = require('fs');

var special = {
    'files' : files.server,
    'ol-c'  : authenticate
};

//  TODO: have workers report the objectIDs they control
//        along with their port numbers and hosts

var processes = {
    '1' : {
        root : '1394488436895988200',
        port  : 8001
    },
    '2' : {
        root : '1394491492339584300',
        port  : 8002
    },
    '3' : {
        root : '1394481424832363300',
        port : 8003
    }
};

if (cluster.isMaster) {
    var hosts = {};
    //  TODO: create add subdomain processes as they come in
    for (var subdomain in processes) {
        var environment = processes[subdomain];
        worker = cluster.fork(environment);
        worker.host = {
            host : '127.0.0.1', //  replace with actual host
            port : environment.port
        };
        worker.on('message', respond(worker));
    }
    function respond(worker) {
        var actions = {
            'get host' : function (message) {
                worker.send({
                    token : message.token,
                    response : hosts[message.id]
                });
            },
            'controlling object' : function (message) {
                hosts[message.id] = worker.host;
            }
        };
        return function (message) {
            var action = actions[message.action];
            action(message);
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
    app.use(function (request, response) {
        response.end(fs.readFileSync('./static/index.html'));
    });
    app.listen(80);
    var HTTPserver = http.createServer(app); 
    var WSserver = new ws.Server({server : HTTPserver});
    WSserver.on('connection', persist.handleWS);
    HTTPserver.listen(80);

    //  notify master process when this worker has taken
    //  control of an object
    persist.on('control', function (id) {
        process.send({
            'action' : 'controlling object',
            'id'     : id
        });
    });

    //  load root object
    persist.load(process.env.root, {}, function (err, res) {
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

    //  persist communicates over tcp
    TCPserver = net.createServer(persist.handleTCP);
    TCPserver.listen(process.env.port);
}
