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

//  encrypted session token to email
var pending_authentications = {};

//  session token to email
var authenticated = {};

var persistant = {};

http.createServer(function (request, response) {
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
    
    request.authentication = authenticated[cookies.session];

    console.log(request.authentication);
    var path = url_data.pathname.substring(1).split('.');

    if (host.split('.').length = 2) {
        if (data.token) {
            var encrypted_token = encodeToken(data.token + cookies.session);
            var pending_auth = pending_authentications[encrypted_token];
            if (pending_auth) {
                authenticated[cookies.session] = pending_auth;
                delete pending_authentications[encrypted_token];
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
                   var encrypted_token = encodeToken(token + cookies.session);
                   pending_authentications[encrypted_token] = data.email;
                   response.end(JSON.stringify(pending_authentications, null, 4));
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
}).listen(80);
