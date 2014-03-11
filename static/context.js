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

    var host_ids = {
        '1.localhost' : '1394488436895988200',
        '2.localhost' : '1394491492339584300',
        '3.localhost' : '1394481424832363300',
    };

    ws.onopen = function () {
        var message = {
            id: host_ids[window.location.host], //  this will be the root reference for ol-c
            internal : window.location.hash.slice(1)
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
