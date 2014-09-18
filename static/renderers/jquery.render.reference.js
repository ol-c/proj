$.fn.render.reference = function (item, after, parent_source)  {

    var self = this;
    this.append(self);

//    self.append(node.container());

     var reference = item.reference;


    var content = $('<span>');
    self.append(content);

    function render_referenced(reference, node) {
        return function () {
            //  resolve reference
            var container = $('<div>').css({
                display : 'inline-block'
            });

            resolve_reference(reference, function (item) {
                var insert = $('<div>').css({
                    display : 'inline-block'
                });
                insert.render(item, after, node.node());
                container.append(insert);
            });

            return container;
        };
    }

    function render(data) {
        content.empty();
        content.append('reference');
        for (var i=0; i<data.length; i++) {
            var node = new node_generator(parent_source);

            node.render(render_referenced(data.slice(0, i+1), node));
            var container = node.container();

            var name = data[i].name;
            if (data[i].type == 'reference') {
                //  show relative binding
                if (data[i].relative) {
                    container.text('.' + data[i].relative);
                }
                else if (name.match(/^\w(\w|\d)*$/)) {
                    container.text('.' + name);
                }
                else {
                    container.text('["' + name + '"]');
                }
            }
            else {
                var args = [];
                for (var j=0; j<data[i].arguments.length; j++) {
                    //  TODO: create source code from type
                    var arg = JSON.stringify(data[i].arguments[j]);
                    args.push(arg);
                }
                container.append('(', args.join(', ') ,')');
            }
            content.append(container);
        }
    }

    render(item.data);


    function watch_fn(update) {
        if (update.value.type == 'reference') {
            render(update.value.data);
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
        }
    }

};
