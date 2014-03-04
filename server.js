var express = require('express');
var http    = require('http');
var net     = require('net');
var ws      = require('ws');
var aws     = require('aws');
var files   = require('files');
var persist = require('persist');

var domains = {};

//  serve static files
var app = express();
app.use(express.favicon(__dirname + '/static/favicon.ico'));
app.use('/files', files.server);
app.use(express.static('./static'));
var HTTPserver = http.createServer(app);
HTTPserver.listen(80);

//  load test object
persist.load('1393833919196379100', {}, function (err, res) {
    if (err) console.log('error loading test object');
});

//  persist communicates over websockets
var WSserver = new ws.Server({server : HTTPserver});
WSserver.on('connection', persist.handleWS);

//  persist communicates over tcp
var TCPserver = net.createServer(persist.handleTCP);
TCPserver.listen(8888);

/* TODO:

    each domain corresponds to a user and a process
    each domain's process has its user's persistant object

*/
