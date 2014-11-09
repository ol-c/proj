$.fn.render.client = function (item, after, parent_source)  {

    var self = this;
    this.append(self);

    var reference = item.reference;

    var node = new node_generator(parent_source);

    function error_report(error) {
        var container = $('<div>').css({
            color : 'red',
            whiteSpace : 'pre',
            padding : '4ch',
            fontFamily : 'monospace'
        });
        container.text(error.toString());
        return container;
    }

    var clients = {
        js : function (value) {
            var result;
            try           {return eval('(function () {' + value + '})()'); }
            catch (error) {return error_report(error); }
        },
        html : function (source) {
            var container = $('<div>');
            container.append(source);
            return container;
        },
        md : function (value) {
            return "formatted markdown";
        },
        angular : function (value) {
            return "rendered angular in the context of the object that holds this client";
        }
    };
    var language_to_highlighter = {
        js : 'javascript'
    }
    function render() {
        source_container.empty();
        source_container.append(clients[item.data.language](item.data.script));
        return source_container;
    }
    node.render(render);
    var container = node.container().text(item.data.language + ' client');
    self.append(node.container());

    var source_node = new node_generator(node.node());
    var source_container = source_node.container();
    var editor = new_editor();
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
            highlighting : language_to_highlighter[item.data.language]
        });
        return editor;
    })

    function watch_fn(update) {
        if (update.value.type == 'client' && update.value.data.language == item.data.language) {
            item.data.script = update.value.data.script;
            if (editor) editor.trigger('update', item.data.script);
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
