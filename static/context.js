
var responses = {};
var updates = {};

function hash_reference(reference) {
    var hashed = 'reference';
    for (var i=0; i<reference.length; i++) {
        var ref = reference[i];
        if (ref.type == 'reference') {
            hashed += '["' + ref.name + '"]';
        }
        else if (ref.type == 'call') {
            hashed += '()'; //  TODO: add arguments
        }
        else {
            throw new Error('error hashing reference...');
        }
    }
    return hashed;
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

function resolve_reference(reference, callback) {
    perform_operation({
        type : 'source reference',
        reference : reference
    }, callback);
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
        var reference = [
            {type : 'reference', name : root_id} //  TODO add internal references...
        ];
        var source_ref = 'this';
        evaluate_script(reference, 'this', function (result) {
            if (result.type == 'success') {
                $(document.body).render(result.value);
            }
            else if (result.type == 'error' && result.data == "no host for reference") {
                window.location.href = 'http://auth.' + window.location.host;
            }
            else {
                $(document.body).render(result);
            }
        });
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
                console.log(updates_to_do.length, todo, updates_to_do);
            }
        }
    };
    ws.onclose = function (event) {
        console.log("Connection is closed...", event); 
    };
    ws.onerror = function (event) {
        console.log('error', event);
    };

    var scale = 1;
    var offset = [0,0]
});


function bind_css(element, name, value) {
    if (value.type == 'string' || value.type == 'number') {
        element.css(name, value.data);
    }
    else if (value.type == 'reference') {
        var path = [].concat(value.data);
        var reference = {
            id : path.shift(),
            internal : path.join('.')
        };
        function update(value) {
            bind_css(element, name, value);
        }
        watch(reference, function (response) {
            if (response.value.type == 'reference') {
                //  this short wires the references and keeps the resolved value to the original target
                //  if the reference changes, we now no longer get the current value that this reference targeted
                unwatch(reference, update);
            }

            update(response.value);
        });

        resolve_reference(reference, function (response) {
            update(response);
        });
    }
}

function bind_attribute(element, name, value) {
    if (name == 'style' && value.type != 'string') {
        for (var field in value) {
            bind_css(element, field, value[field]);
        }
    }
    else if (value.type == 'string' || value.type == 'number') {
        element.attr(name, value.data);
    }
    else if (value.type == 'reference') {
        var path = [].concat(value.data);
        var reference = {
            id : path.shift(),
            internal : path.join('.')
        };
        function update(value) {
            bind_attribute(element, name, value);
        }
        watch(reference, function (response) {
            if (response.value.type == 'reference') {
                //  this short wires the references and keeps the resolved value to the original target
                //  if the reference changes, we now no longer get the current value that this reference targeted
                unwatch(reference, update);
            }

            update(response.value);
        });

        resolve_reference(reference, function (response) {
            update(response);
        });
    }
}

function bind_html(element, value, replace) {
    if (value.type == 'string' || value.type == 'number') {
        var DOM_elements = $($.parseHTML(value.data, document, true));
        if (replace) {
            element.replaceWith(DOM_elements);
        }
        else {
            element.append(DOM_elements);
        }
        return DOM_elements;
    }
    else if (value.type == 'reference') {
        var reference = [].concat(value.data);
        var last_value = $('<div>loading...</div>');
        element.append(last_value);
        function update(value) {
            last_value = bind_html(last_value, value, true);
        }
        watch(reference, function (response) {
            if (response.value.type == 'reference') {
                //  this short wires the references and keeps the resolved value to the original target
                //  if the reference changes, we will no longer get the current value that this reference targeted
                unwatch(reference, update);
            }
            update(response.value);
        });

        resolve_reference(reference, function (response) {
            update(response);
        });
        return last_value;
    }
    else {
        var placeholder = $("<pre>").text("Illegal value for render function to return: " + JSON.stringify(value, null, 4));
        element.append(placeholder);
        return placeholder;
    }

}
