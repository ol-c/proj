$.fn.render.undefined = function (item, after, parent_node) {
    var self = this;
    var reference = item.reference

    var n = $('<span>undefined</span>');
    n.css({
        color : '#888888'
    });
    $(this).append([n, after]);

    function watch_fn(update) {
        if (update.value.type == 'null') {
            
        }
        else {
            self.empty();
            self.render(update.value, after, parent_node);
            unwatch(reference, watch_fn)
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
