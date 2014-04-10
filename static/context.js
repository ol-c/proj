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


function remote_function_call(reference) {
    //  user argument is assumed
    return function (params) {
        perform_operation({
            type : 'evaluate',
            reference : reference,
            parameters : params
        }, function (response) {
            if (reference.waiting instanceof Array) {
                while (reference.waiting.length) {
                    reference.waiting.pop()(response);
                }
            }
        });
    }
}

function watch(reference, on_change) {
    perform_operation({
        type : 'watch',
        reference : reference
    },
    function (response) {
    });
}

//  Shared with Persist...
//  take a serializable value and ble
function instance_from_serializable(value) {
    var unserialized;
    //  TODO: if value.data has unexpected form
    //        for type, throw an error
    if (value.type == 'string') {
        unserialized = value.data;
    }
    else if (value.type == 'function') {
        //  server scopes the function, front end will call it remotely
        unserialized = remote_function_call(value.reference);
    }
    else if (value.type == 'boolean') {
        unserialized = value.data;
    }
    else if (value.type == 'null') {
        unserialized = null;
    }
    else if (value.type == 'number') {
        unserialized = value.data;
    }
    else if (value.type == 'reference') {
        unserialized = new Reference(value.data);
    }
    else if (value.type == 'file') {
        unserialized = new File(value.data);
    }
    else if (value.type == 'undefined') {
        unserialized = undefined;
    }
    else {
        throw new Error('cannot unserialize type: ' + value.type);
    }
    return unserialized;
}


function resolve_references(object, callback) {
    var todo = 0;
    var results = {};
    function get_field(field) {
        todo += 1;
        return function (res) {
            results[field] = instance_from_serializable(res);
            todo -= 1;
            if (todo == 0) callback(null, results);
        }
    }
    for (var field in object) {
        perform_operation({
            type : 'source reference',
            reference : object[field],
        }, 
        get_field(field));
    }
    if (todo == 0) callback(null, results);
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
    //  this assumes serializable is synchronous
    if (old_value) {
        serializable(old_value, reference, function (err, res) {
            if (err) console.log(err);
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
        
    });
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
        perform_operation(root_reference_operation, function (response) {
            console.log(response);
            $('body').render(response);
            watch(root_reference_operation.reference);
            watch(root_reference_operation.reference);
        });
    };

    var references = {};

    ws.onmessage = function (event) {
        //  sending protocol adds """ to separate JSON responses
        var data_string = event.data.replace('"""', '');
        var data = JSON.parse(data_string);
        console.log(data);
        var ref = data.reference.id;
        var internal = '';
        if (data.reference.internal) internal = '.' + data.reference.internal;
        var response = responses[ref + internal];
        while (response.length > 0) response.pop()(data);
    };
    ws.onclose = function (event) {
        console.log("Connection is closed...", event); 
    };
    ws.onerror = function (event) {
        console.log('error', event);
    }
});
