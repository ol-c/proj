$.fn.render.reference = function (item, after)  {
    var self = this;
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
    self.append(after);

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
