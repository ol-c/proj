$.fn.render.promise = function (item, after, parent_source)  {

    var self = this;
    this.append(self);
    var node = new node_generator(parent_source);

    var reference = item.reference;


    var functions = $('<table>');
    var functions_table = $('<tbody>');

    functions.css({
        borderSpacing : '1em'
    });


    var fulfill = $('<td>');
    var reject = $('<td>');
    fulfill.text('on fulfill:');
    reject.text('on reject:');
    fulfill.css({
        color : 'limegreen'
    });
    reject.css({
        color : 'tomato'
    })
    var header = $('<tr>');
    header.append([fulfill, reject]);
    functions_table.append(header);

    functions.append(functions_table);

    function add_functions(fulfill_ref, reject_ref) {
        var row = $('<tr>');
        var fulfill = $('<td>');
        var reject = $('<td>');
        var fulfill_data = {};

        if (fulfill_ref.length) {
            fulfill.render({
                type : 'reference',
                data : fulfill_ref
            }, undefined, node.node());
        }
        else {
            fulfill.render({
                type : 'undefined',
            });
        }
        if (reject_ref.length) {
            reject.render({
                type : 'reference',
                data : reject_ref
            }, undefined, node.node());
        }
        else {
            reject.render({
                type : 'undefined'
            });
        }
        row.append([fulfill, reject]);
        functions_table.append(row);
    }

    node.render(function () {
        return functions;
    });


    var content = node.container();
    var tag = $('<span>');
    tag.text('Promise');
    var state = $('<span>');
    state.css({
        fontStyle : 'italic'
    });
    function update_state() {
        if (item.data.fulfilled) {
            state.text('fulfilled');
            state.css({
                color : 'limegreen'
            });
        }
        else if (item.data.rejected) {
            state.text('rejected');
            state.css({
                color : 'tomato'
            });
        }
        else if (item.data.delayed) {
            state.text('delayed');
            state.css({
                color : '#888888'
            })
        }
        else {
            state.text('pending');
            state.css({
                color : '#888888'
            });
        }
    }
    update_state();
    content.append([state, ' ', tag]);
    self.append(content);

    for (var i=0; i<item.data.fulfill.length; i++) {
        add_functions(item.data.fulfill[i], item.data.reject[i]);
    }

    function watch_fn(update) {
        if (update.value.type == 'promise') {
            //  TODO: update rendered state
            if (update.value.operation == 'fulfill') {
                item.data.fulfilled = true;
                update_state();
            }
            else if (update.value.operation == 'reject') {
                item.data.rejected = true;
                update_state();
            }
            else if (update.value.operation == 'delay') {
                item.data.delayed = true;
                update_state();
            }
            else if (update.value.operation == 'then') {
                console.log(update);
                item.data.fulfill = item.data.fulfill.concat(update.value.fulfill);
                item.data.reject  = item.data.reject.concat(update.value.reject);
                for (var i=0; i<update.value.fulfill.length; i++) {
                    add_functions(update.value.fulfill[i], update.value.reject[i]);
                }
            }
            else {
                //  TODO: log and unrecognized operation...
            }
        }
        else {
            self.empty();
            self.render(update.value, after, parent_source);
            unwatch(reference, watch_fn);
        }
    }
    watch(item.reference, watch_fn);

    return {
        change_reference : function (new_reference) {
            unwatch(reference, watch_fn);
            reference = new_reference;
            watch(reference, watch_fn);
        },
        unrender : function () {
            unwatch(reference, watch_fn);
        }

    }

};
