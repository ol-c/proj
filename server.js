var cluster = require('cluster');
var express = require('express');
var http    = require('http');
var net     = require('net');
var ws      = require('ws');
var files   = require('files');
var persist = require('persist');
var fs      = require('fs');
var auth    = require('auth');

var special_subdomains = {
    files : files.server
};

function parseCookies (request) {
    var list = {};
    var rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
}

if (cluster.isMaster) {
    var workers = [];
    var hosts   = {
        'auth' : {
            root : 'auth',
            host : '127.0.0.1',
            port : 8001
        }
    };
    control_root_object('ol-c', 'fordjason@gmail.com', function (err) {
        if (err) console.log(err);
        else {}
    });

    function control_root_object(root, owner, callback) {
        //  Check if root already exists, if not
        //  create it here and unload it so worker
        //  can take control
        persist.exists(root, function (err, exists) {
            if (err) callback('error checking if root object exists');
            else if (exists) spawn_worker_for_root(root, owner, callback);
            else {
                persist.set_root(root);
                var root_object = persist.create('hashmap', root);
                if (persist.get_owner(root_object) == undefined) {
                    persist.set_owner(root_object, owner);
                }
                persist.unload(root_object, function (err) {
                    if (err) callback('error unloading before spawning worker');
                    else     spawn_worker_for_root(root, owner, callback);
                });
            }
        });
    }

    function spawn_worker_for_root(root, owner, callback) {
        var environment = {
            root : root,
            host : '127.0.0.1',
            port : 8001 + workers.length
        };
        worker = cluster.fork(environment);
        worker.host = environment;
        hosts[environment.root] = environment;
        workers.push(worker);
        worker.onServerReady = function (err) {
            //  TODO: broadcast control to all other servers
            if (err) callback(err);
            else     callback(null, environment);
        }
        worker.on('message', respond(worker));
    }

    function get_host(objectID, callback) {
        //  TODO: check other servers
        callback(null, hosts[objectID]);
    }

    function respond(worker) {
        var reactions = {
            'host request' : function (message) {
                get_host(message.id, function (err, host) {
                    function respond(host) {
                        worker.send({
                            token : message.token,
                            response : host
                        });
                    }
                    if (err) callback('error getting external host');
                    else if (host) respond(host);
                    else if (message.requester === 'anonymous') {
                        //  if no host and anonymous, return no host
                        respond(null);
                    }
                    else {
                        // claim control of this root since there is no other host
                        control_root_object(message.id, message.requester, function (err) {
                            if (err) console.log('error occurred controlling root object');
                            else     respond(hosts[message.id]);
                        });
                    }
                });
            },
            'object controlled' : function (message) {
                hosts[message.id] = worker.host;
            },
            'control root' : function (message) {
                 control_root_object(message.name, message.owner, function (err) {
                     if (err) console.log(err);
                     else {}
                 });
            },
            'initialized' : function (message) {
                if (worker.onServerReady) worker.onServerReady();
                delete worker.onServerReady;
            }
        };
        return function (message) {
            var reaction = reactions[message.event];
            reaction(message);
        }
    }
}
else {

    //  set agent so we know what agent to attach to executing functions
    persist.set_agent(process.env.root);
    persist.set_root(process.env.root);

    var app = express();
    app.use(auth.middleware);
    app.use(function (req, res, next) {
        var subdomain = req.headers.host.split('.').shift();
        if (special_subdomains[subdomain]) {
            special_subdomains[subdomain](req, res, next);
        }
        else {
            next();
        }
    });
    app.use(express.static(__dirname + '/static'));
    app.use(function (request, response) {
        response.end(fs.readFileSync(__dirname + '/static/index.html'));
    });

    var HTTPserver = http.createServer(app); 
    var WSserver = new ws.Server({server : HTTPserver});
    WSserver.on('connection', function (websocket) {
        var cookies = parseCookies(websocket.upgradeReq);
        websocket.session = {
            id : cookies.id
        };
        websocket.type = 'websocket';
        persist.handleWS(websocket);
    });
    HTTPserver.listen(80, initialize);

    //  notify master process when this worker has taken
    //  control of an object
    persist.on('control', function (id) {
        process.send({
            'event' : 'object controlled',
            'id'    : id
        });
    });

    //  load root object
    persist.load(process.env.root, function (err, res) {
        if (err) throw new Error('Could not load root object');
        else     initialize();
    });

    //  create resolver so persist can connect
    //  to other persist instances
    var waiting_responses = {};
    persist.resolve_hosts(function (id, requester, callback) {
        var token = Math.random();
        process.send({
            'token' : token,
            'event' : 'host request',
            'requester' : requester,
            'id'    : id
        });
        waiting_responses[token] = callback;
    });

    //  react to messages from master
    process.on('message', function (message) {
        var waiting = waiting_responses[message.token];
        if (waiting) {
            waiting(null, message.response);
            delete waiting_responses[message.token];
        }
    });

    //  catch exceptions in this process
    process.on('uncaughtException', function (err) {
        //  log all the stuff leading up to this
        console.log(err.stack);
    });

    //  persist instances communicat over TCP
    TCPserver = net.createServer(persist.handleTCP);
    TCPserver.listen(process.env.port, initialize);

    var initializing = 3;
    function initialize() {
        initializing -= 1;
        if (initializing == 0) {
            process.send({ event : 'initialized'});
        }
    }
}
