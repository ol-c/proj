$.fn.render.reference = function (item, after)  {
    var self = this;
    var content = $('<span>');
    self.append(content);
    function dot_reference(name) {
        return '.' + name;
    }
    function function_reference(name) {
        return '.' + name;
    }
    function bracket_reference(name) {
        return '["' + name + '"]';
    }
    function render(data) {
        content.empty();
        content.append('reference');
        for (var i=0; i<data.length; i++) {
            var name = data[i];
            if (name.match(/^\w(\w|\d)*$/)) {
                content.append(dot_reference(name));
            }
            else if (name.match(/^\w(\w|\d)*(|\(.*)\)$/)) {
                content.append(function_reference(name));
            }
            else {
                content.append(bracket_reference(name));
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
