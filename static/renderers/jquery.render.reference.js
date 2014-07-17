$.fn.render.reference = function (item, after, parent_source)  {

    var node = new node_generator(parent_source);
    var self = node.container();
    this.append(self);

    self.append(node.container());



    var content = $('<span>');
    self.append(content);

    function render(data) {
        content.empty();
        content.append('reference');
        for (var i=0; i<data.length; i++) {
            var name = data[i].name;
            if (data[i].type == 'reference') {
                if (name.match(/^\w(\w|\d)*$/)) {
                    content.append('.' + name);
                }
                else {
                    content.append('["' + name + '"]');
                }
            }
            else {
                var args = [];
                for (var j=0; j<data[i].arguments.length; j++) {
                    //  TODO: create source code from type
                    var arg = JSON.stringify(data[i].arguments[j]);
                    args.push(arg);
                }
                content.append('(', args.join(', ') ,')');
            }
        }
    }

    render(item.data);

    node.render(function () {
        //  TODO: resolve reference
        var container = $('<div>').css({
            display : 'inline-block'
        });

        resolve_reference(item.data, function (item) {
            var insert = $('<div>').css({
                display : 'inline-block'
            });
            insert.render(item, after, node.node());
            container.append(insert);
        });

        return container
    });



    function watch_fn(update) {
        if (update.value.type == 'reference') {
            render(update.value.data);
        }
        else {
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);
};
