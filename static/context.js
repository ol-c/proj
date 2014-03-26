var responses = {};
function getReference(reference, cb) {
    var internal = '';
    if (reference.internal) internal = '.' + reference.internal;
    if (responses[reference.id + internal] === undefined) {
        responses[reference.id + internal] = [];
    }
    responses[reference.id + internal].push(cb);
    ws.send(JSON.stringify(reference));
}

var ws = new WebSocket('ws://' + window.location.host + '/');

$(function () {
    ws.onopen = function () {
        var message = {
            type     : 'source reference',
            id       : window.location.host.split('.').shift(), //  this will be the root reference for ol-c
            internal : window.location.pathname.slice(1)
        };
        getReference(message, function (response) {
            $('body').render(response);
        });
    };
    ws.onmessage = function (event) {
        var data = JSON.parse(event.data);
        console.log(data);
        var ref = data.reference.id;
        var internal = '';
        if (data.reference.internal) internal = '.' + data.reference.internal;
        var response = responses[ref + internal];
        while (response.length > 0) {
            response.pop()(data);
        }
    };
    ws.onclose = function (event) {
        console.log("Connection is closed...", event); 
    };
    ws.onerror = function (event) {
        console.log('error', event);
    }
});
