var http = require('http');
var crypto = require('crypto');
var url = require('url');
var querystring = require('querystring');

var persist = require('persist');
var email = require('email')

function parseCookies (request) {
    var list = {};
    var rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
    return list;
}

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function encodeToken(token) {
    return crypto.createHash('sha512').update(token).digest('hex');
}
var server = http.createServer(function (request, response) {
    var host = request.headers.host;
    var cookies = parseCookies(request);
    var url_data = url.parse(request.url);
    var data = querystring.parse(url_data.query);

    //  handle authentication
    if (cookies.session === undefined) {
        var token = generateToken();
        response.writeHead(200, {
            'Set-Cookie': 'session=' + token
        });
        cookies.session = token;
    }

    var session = persistant.authentication[cookies.session];
    if (session === undefined) {
        session = persist.create('map', context);
        persistant.authentication[cookies.session] = session;
    }

    var path = url_data.pathname.substring(1).split('.');

    if (host.split('.').length = 2) {
        if (data.token) {
            var encrypted_token = encodeToken(session.pending_email + data.token + cookies.session);
            if (session.encrypted_token == encrypted_token) {
                session.email = session.pending_email;
                response.end();
            }
            else {
                response.statusCode = 401;
                response.end();
            }
        }
        else if (data.email) {
            var token = generateToken();
            var authenticate_email = {
                to : data.email,
                from : 'authenticate@ol-c.com',
                subject : 'ol-c authentication',
                text : 'Your single use authentication token:\r\r' + token
            }
            email.send(authenticate_email, function (err) {
                if (err) {
                    console.log(err);
                    response.statusCode = 500;
                    response.end();
                }
                else {
                    var encrypted_token = encodeToken(data.email + token + cookies.session);
                    session.encrypted_token = encrypted_token;
                    session.pending_email = data.email;
                    response.end();
                }
            });
        }
        else {
            response.statusCode = 405;
            response.end();
        }
    }
    else {
        //  get reference
        var path = url_data.pathname.split('.');
        var requested = persistant[root];
        while (requested !== undefined && path.length) {
            var reference = path.shift();
            if (reference !== '') requested = requested[reference];
        }

        //  generate response
        if (requested !== undefined) {
            if (typeof requested === 'function') {
                response.end("execute: " + requested);
            }
            else {
                response.end(requested + '')
            }
        }
        else {
            response.statusCode = 404;
            response.end('404');
        }
    }
});

var context = {};

var persistant;
//  load persistant object
if (process.argv[2]) {
    persistant = persist.load(process.argv[2], context, function (err, persistant) {
        console.log('loaded existing persistant object');
        server.listen(80);
    });
}
else {
    persistant = persist.create('map', context);
    persistant.authentication = persist.create('map', context);
    console.log('created new persistant root with id: ' + persist.identify(persistant));
    server.listen(80);
}


