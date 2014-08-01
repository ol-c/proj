$.fn.render.promise = function (item, after, parent_source)  {

    var self = this;
    this.append(self);
    var node = new node_generator(parent_source);
    node.render(function () {
        return $('<pre>functions for:\n  - fulfill\n  - reject</pre>');
    });



    var content = node.container();
    content.append('promise (TODO: show state)');
    self.append(content);
    render(item.data);


    function watch_fn(update) {
        if (update.value.type == 'promise') {
            //  TODO: update state
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
