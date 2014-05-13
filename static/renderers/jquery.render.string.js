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
        var edits = [];
        content.on('useredit', function (event, data) {
            edits.push(data);
        });
        content.on('change', throttle(100, function () {
            if (edits.length) {
                var edit_source = '';
                while (edits.length) {
                    edit_source += 'this.' + item.reference.internal + ' = (' + edits.shift() + ')(this.' + item.reference.internal + ');\n';
                }
                evaluate_script({id : item.reference.id}, edit_source);
            }
        }, function (err, res) {
            // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
            
        }));
        
        function watch_fn(update) {
            if (update.value.type == 'string') {
                content.trigger('update', update.value.data);
            }
            else {
                self.empty();
                self.render(update.value, after);
                unwatch(item.reference, watch_fn);
            }
        }

        watch(item.reference, watch_fn);
}
