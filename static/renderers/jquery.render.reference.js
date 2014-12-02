$.fn.render.reference = function (item, after, parent_source)  {

    var self = this;
    this.append(self);

//    self.append(node.container());

     var reference = item.reference;


    var content = $('<span>');
    self.append(content);

    function render_referenced(reference, container, placeholder) {
        resolve_reference(reference, function (item) {
            var insert = $('<div>').css({
                display : 'inline-block'
            });
            if (item.type == "hashmap" || item.type == 'list') {
                container.render(item, null, parent_source, {
                    placeholder : placeholder
                });
            }
            else {

                var node = new node_generator(parent_source, hash_reference(reference));

                insert.render(item, after, node.node());
                node.render(function () {
                    return insert;
                });
                node.container().append(placeholder);
                container.append(node.container());
            }
        });
    }

    function render(data) {
        content.empty();
        content.append('reference');
        for (var i=0; i<data.length; i++) {
            var container = $('<div>').css('display', 'inline-block');
            var placeholder;

            var name = data[i].name;
            if (data[i].type == 'reference') {
                //  show relative binding
                if (data[i].relative) {
                    placeholder = '.' + data[i].relative;
                }
                else if (name.match(/^\w(\w|\d)*$/)) {
                    placeholder = '.' + name;
                }
                else {
                    placeholder = '["' + name + '"]';
                }
            }
            else {
                var args = [];
                for (var j=0; j<data[i].arguments.length; j++) {
                    //  TODO: create source code from type
                    var arg = JSON.stringify(data[i].arguments[j]);
                    args.push(arg);
                }
                placeholder = '(', args.join(', ') ,')';
            }
            render_referenced(data.slice(0, i+1), container, placeholder);
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
        },
        unrender : function () {
            unwatch(reference, watch_fn);
        }
    }

};
