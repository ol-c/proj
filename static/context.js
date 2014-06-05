
var responses = {};
var updates = {};

function hash_reference(reference) {
    var id = reference.id;
    var internal = '';
    if (reference.internal) {
        internal = '.' + reference.internal;
    }
    return id + internal;
}

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
    var token = Math.random() + '';
    operation.token = token;
    responses[token] = cb;
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

function watch(reference, on_change) {
    //  TODO: perform on_change function when an update is passed
    var hashed_reference = hash_reference(reference);
    if (updates[hashed_reference] == undefined) {
        perform_operation({
            type : 'watch',
            reference : reference
        },
        function (response) {

        });
        updates[hashed_reference] = [];
    }
    updates[hashed_reference].push(on_change);
}

function unwatch(reference, fn) {
    var hashed_reference = hash_reference(reference);
    var these_updates = updates[hashed_reference];
    if (these_updates == undefined) {
        these_updates = [];
    }
    for (var i=0; i<these_updates.length; i++) {
        if (these_updates[i] == fn) {
            these_updates.splice(i, 1);
            i -= 1;
        }
    }
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


function evaluate_script (reference, script, callback) {
    perform_operation({
        type : "evaluate",
        reference : reference,
        script : script,
    }, callback);
} 

var ws = new WebSocket('ws://' + window.location.host + '/');

$(function () {
    ws.onopen = function () {
        var root_id = window.location.host.split('.').shift();
        var internal_reference = window.location.pathname.slice(1)
        internal_reference = decodeURIComponent(internal_reference);
        var reference = {
            id        : root_id,
            internal  : internal_reference
        };
        var source_ref = 'this';
        if (internal_reference) source_ref += '.' + internal_reference;
        //  try and show the rendered version of a datatype, otherwise show the code version
        evaluate_script(reference, source_ref + '.render ? ' + source_ref + '.render() : ' + source_ref + ';', function (response) {
            console.log(response)
            if (response.value.type == 'string') {
                $(document.body).append(response.value.data);
            }
            else {
                show_in_container(response.value);
            }
        });

        var editing = false;

        $(window).on('keydown', function (e) {
            if (!editing && e.ctrlKey && e.which == 69) {
                editing = true;
                e.preventDefault();
                evaluate_script(reference, source_ref, function (response) {
                    show_in_container(response.value);
                });
            }
        });
        function show_in_container(value) {
            var container = $('<div>');
            $(document.body).append(container);
            $(container).render(value);
            container.css({
                position: 'fixed',
                top : 0,
                left : 0,
                backgroundColor :'rgba(255,255,255, .9)',
                padding : '1em',
                border : '2px solid #CCCCCC'
            });
            container.behave({
                draggable : {}
            });
         }

    };

    var references = {};

    ws.onmessage = function (event) {
        //  sending protocol adds """ to separate JSON responses
        var data_string = event.data.replace('"""', '');
        var data = JSON.parse(data_string);
        console.log(data);
        var response = responses[data.token];
        if (response) response(data);
        if (data.type == 'update') {
            var hashed_reference = hash_reference(data.reference);
            var updates_to_do = updates[hashed_reference];
            if (updates_to_do) {
                var todo = updates_to_do.length;
                for (var i=0; i<todo; i++) {
                    updates_to_do[i](data);
                }
            }
        }
    };
    ws.onclose = function (event) {
        console.log("Connection is closed...", event); 
    };
    ws.onerror = function (event) {
        console.log('error', event);
    }

    var scale = 1;
    var offset = [0,0]
});
