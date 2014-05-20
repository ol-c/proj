$.fn.render.hashmap = function (item, after) {
    var self = this;
    $(self).css({
        whiteSpace : 'pre',
        fontFamily : 'monospace',
    });

    function render_hashmap() {
        var open = $('<span>{</span>');
        var command_line = $('<span>');
        command_line.command(item, user_context(item));
        open.append(command_line)
        var content_body = $('<div>');
        var close = $('<span>}</span>');
        var keys = Object.keys(item.data);

        function render(container, reference, end) {
            //  TODO: show loader
            perform_operation({
                type : 'source reference',
                reference : reference
            }, function (item) {
                container.render(item, end);
            });
        }

        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var field = $('<span>').text('"' + key.replace('"', '\\"') + '"');
            var divider = $('<span> : </span>');
            divider.css({
                color : '#888888'
            });
            var value = $('<span>');
            var terminate = undefined;
            
            if (i < keys.length - 1) {
                terminate = $('<span>,</span>');
                terminate.css({
                    color : '#888888'
                });
            }
            render(value, item.data[key], terminate);
            var row = $('<div>');
            row.append([field, divider, value]);
            content_body.append(row);
            $(field).add(divider).add(value).css({
                padding : 0,
                borderSpacing : 0,
            });
            var key_width = 5 + key.length;
            field.css({
                color : 'lime',
                marginLeft : (-key_width) + 'ex'
            });
            row.css({
                paddingLeft : (4 + key_width) +'ex'
            });
        }
        rendered = $('<span>');
        $(rendered).append([open, content_body, close]);
        container.append(rendered);
    }
    var container = $('<div></div>');
    $(this).append(container);
    render_hashmap();

    function watch_fn(update) {
        if (update.value.type == 'hashmap') {
            console.log('HASHMAP UPDATED!!!!', update);
        }
        else {
            console.log('uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuhhhhhhh')
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);

};
