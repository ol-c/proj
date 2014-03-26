var responses = {};
function perform_operation(operation, cb) {
    var internal = '';
    if (operation.reference.internal) internal = '.' + operation.reference.internal;
    if (responses[operation.reference.id + internal] === undefined) {
        responses[operation.reference.id + internal] = [];
    }
    responses[operation.reference.id + internal].push(cb);
    ws.send(JSON.stringify(operation));
}

var ws = new WebSocket('ws://' + window.location.host + '/');

$(function () {
    ws.onopen = function () {
        var root_id = window.location.host.split('.').shift();
        var internal_reference = window.location.pathname.slice(1)
        var root_reference_operation = {
            type      : 'source reference',
            reference : {
                id        : root_id, //  this will be the root reference for ol-c
                internal  : internal_reference
            }
        };
        var set_root_value_operation = {
            type : 'set',
            reference : {
                id : root_id,
                internal : 'more awesome function!'
            },
            value : {
                type : 'function',
                data : 'function () {\n    var x = 1;\n    var variation = new Date();\n    /* what a function! */\n}'
            },
            expected : {
                type : 'undefined',
                data : 'function () {\n    var x = 1;\n    var variation = new Date();\n    /* what a function! */\n}'
            }
        };
        perform_operation(set_root_value_operation, function (response) {
            perform_operation(root_reference_operation, function (response) {
                $('body').render(response);
            });
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
