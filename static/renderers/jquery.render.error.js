$.fn.render.error = function (item, after, parent_node) {
    var self = this;
    var message = $('<pre>');
    message.css({
        color : 'tomato'
    });
    message.append(item.data);
    self.append(message);

    var reference = item.reference;

    function watch_fn(update) {
        if (update.value.type == 'error') {
            message.text(update.value.data);
        }
        else {
            self.empty();
            self.render(update.value, after, parent_node);
            unwatch(reference, watch_fn);
        }
    }
//    do not watch reference
//    errors must be removed/dealt with at a container level
//    watch(reference, watch_fn);


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
