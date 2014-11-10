$.fn.render.client = function (item, after, parent_source)  {

    var self = this;
    this.append(self);

    var reference = item.reference;

    var node = new node_generator(parent_source);

    var clients = $.fn.render.client.clients;

    function render() {
        source_container.empty();
        source_container.append(clients[item.data.language].render(item.data.script));
        return source_container;
    }
    node.render(render);
    var container = node.container().text(item.data.language + ' client');
    self.append(node.container());

    var source_node = new node_generator(node.node());
    var source_container = source_node.container();
    var editor = new_editor();
    var local_updates = {};

    function new_editor() {
        var e = $('<div>');
        if (editor) editor.after(e).remove();
        e.css({
            padding : '4ch'
        });
        return e;
    }
    source_node.render(function () {
        editor.text(item.data.script);
        editor.editor({
            highlighting : clients[item.data.language].highlighter
        });

        var edits = [];
        editor.on('useredit', function (event, data) {
            local_updates[editor.text()] = true;
            edits.push(data);
        });
        //  Ignore the first update for a state that we sent here (only want to update when there is new information)
        editor.on('change', throttle(100, function () {
            if (edits.length) {
                var ref = reference_source('this', [].concat(reference).slice(1));

                var tmp_ref = '__tmp_ref__';
                var edit_source = 'var ' + tmp_ref + ' = ' + ref + '.script;';

                //  compile all updates to a string into one synchronous call
                while (edits.length) {
                    edit_source += tmp_ref + ' = (' + edits.shift() + ')(' + tmp_ref + ');\n';
                }
                //  TODO: protect against injection
                edit_source += ref + ' = new Client("' + item.data.language + '", __tmp_ref__);';

                var ref = [].concat(reference);
                evaluate_script([ref.shift()], edit_source, function (res) {
                    //  TODO: expose errors...
                });
            }
        }));

        return editor;
    })

    function watch_fn(update) {
        if (update.value.type == 'client' && update.value.data.language == item.data.language) {
            item.data.script = update.value.data.script;
            if (local_updates[update.value.data.script]) {
                delete local_updates[update.value.data.script];
            }
            else if (editor) {
                editor.trigger('update', update.value.data.script);
            }
            render();
        }
        else {
            self.empty();
            self.render(update.value, after, parent_source);
            unwatch(reference, watch_fn);
        }
    }

    watch(reference, watch_fn);

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
$.fn.render.client.clients = {};
