var responses = {};

function user_context(item) {
    var context = {
        log : function (ref) {
            console.log(ref);
        }
    };
    return context;
}

function perform_operation(operation, cb) {
    var internal = '';
    if (operation.reference.internal) internal = '.' + operation.reference.internal;
    if (responses[operation.reference.id + internal] === undefined) {
        responses[operation.reference.id + internal] = [];
    }
    responses[operation.reference.id + internal].push(cb);
    ws.send(JSON.stringify(operation));
}

//  shared code with persist
function get_type(val) {
    if      (typeof val == 'string'  ) return 'string';
    else if (typeof val == 'number'  ) return 'number';
    else if (typeof val == 'boolean' ) return 'boolean';
    else if (typeof val == 'function') return 'function';
    else if (typeof val == 'date'    ) return 'date';
    else if (val === null            ) return 'null';
// TODO: handle create of new object...    else if (meta.has(val)           ) return meta.get(val).type;
// TODO: handle file check...    else if (val instanceof File     ) return 'file';
// TODO: handle checking if... is reference    else if (references.is(val)      ) return 'reference';
    else return undefined;
}

//  shared code with persist
function serializable(value, reference, callback) {
        var type = get_type(value);
        var serializable = {};
        serializable.type = type;
        serializable.reference = reference;
        if (type == 'hashmap') {
            serializable.data = {};
            var id = meta.get(value).id;
            for (var field in value) {
                serializable.data[field] = {
                    id       : id,
                    internal : field
                };
            }
        }
        else if (type == 'string' || type == 'boolean' || type == 'number') {
            serializable.data = value;
        }
        else if (type == 'reference') {
            serializable.data = 'reference...';
        }
        else if (type == 'file') {
            serializable.data = 'file...';
        }
        else if (type == 'function') {
            serializable.data = value.toString();
        }
        else if (value == undefined) {
            callback(null, {
                type : 'undefined'
            });
            return;
        }
        callback(null, serializable);
}

function set_operation(item, field, old_value, new_value) {
    console.log(item, field, old_value, new_value);
    var internal = [field];
    if (item.reference.internal) {
        internal = item.reference.internal.split('.');
        internal.push(field);
    }
    var reference = {
        id       : item.reference.id,
        internal : internal.join('.')
    };

    var old_serializable;
    var new_serializable;

    //  TODO: handle errors
    if (old_value) {
        serializable(old_value, reference, function (err, res) {
            console.log(err);
            old_serializable = res;
        });
    }
    serializable(new_value, reference, function (err, res) {
        console.log(err);
        new_serializable = res;
    });

    perform_operation({
        type : 'set',
        reference : reference,
        expected : old_serializable,
        value    : new_serializable

    }, function (err, result) {

    })
}

var ws = new WebSocket('ws://' + window.location.host + '/');

$(function () {
    ws.onopen = function () {
        var root_id = window.location.host.split('.').shift();
        var internal_reference = window.location.pathname.slice(1)
        internal_reference = decodeURIComponent(internal_reference);
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
                type : 'undefined'
            }
        };
        perform_operation(root_reference_operation, function (response) {
            console.log(response);
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
        console.log(ref, internal);
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
