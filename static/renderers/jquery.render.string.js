$.fn.render.string = function (item, after) {
        var self = this;

        var string = $('<span>');
        string.css({
            color : 'magenta',
            borderCollapse : 'collapse',
            borderSpacing : 0,
            padding : 0
        });
        var open = $('<span>"</span>');
        string.append(open);
        var content = $('<span>');
        var close = $('<span>"</span>');
        string.append([content, close, after]);
        content.text(item.data);
        $(this).append(string);
        content.editor();
        content.on('change', throttle(3000, then_set(item.reference, function (callback) {
            var text = content.text();
            text = text.replace(/'/mg , "\\'");
            text = text.replace(/\n/mg, "\\n");
            callback("'" + text + "'");
        }, function (err, res) {
            // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
        })));
        
        function watch_fn(update) {
            if (false && update.value.type == 'string') {
                
            }
            else {
                self.empty();
                self.render(update.value, after);
                unwatch(item.reference, watch_fn);
            }
        }

        watch(item.reference, watch_fn);
}
