$.fn.render.null = function (item, after) {
        var self = this;
        var n = $('<span>null</span>');
        n.css({
            color : '#888888'
        });
        $(this).append([n, after]);

        function watch_fn(update) {
            if (update.value.type == 'null') {
                
            }
            else {
                self.empty();
                self.render(update.value, after);
                unwatch(item.reference, watch_fn)
            }
        }

        watch(item.reference, watch_fn);
};
