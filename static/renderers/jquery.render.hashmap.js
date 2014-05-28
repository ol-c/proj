$.fn.render.hashmap = function (item, after) {
    var self = this;
    $(self).css({
        whiteSpace : 'pre',
        fontFamily : 'monospace',
        lineHeight : '1.5em'
    });

    var rendered_fields = {};

    function render_field(key, reference, after) {
        //  TODO: show loader
        var field = $('<span>').text('"' + key.replace('"', '\\"') + '"');
        var divider = $('<span> : </span>');
        divider.css({
            color : '#888888'
        });
        var value = $('<span>');
        var row = $('<div>');
        row.append([field, divider, value, after]);
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

        perform_operation({
            type : 'source reference',
            reference : reference
        }, function (item) {
            value.render(item, after);
        });
        
        rendered_fields[key] = row;

        return row;
    }

    var content_body = $('<div>');
    function render_hashmap() {
        var open = $('<span>{</span>');
        var command_line = $('<span>');
        command_line.command(item, user_context(item));
        open.append(command_line)
        var close = $('<span>}</span>');
        var keys = Object.keys(item.data);
        keys.reverse();

        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var terminate = undefined;
            if (i < keys.length - 1) {
                terminate = $('<span>,</span>');
                terminate.css({
                    color : '#888888'
                });
            }
            var row = render_field(key, item.data[key], terminate);
            content_body.append(row);
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
            var updated_fields = update.value.data;
            var field;
            for (field in updated_fields) {
                if (rendered_fields[field] === undefined) {
                    var rendered = render_field(field, updated_fields[field]);
                    content_body.prepend(rendered);
                }
            }
            for (field in rendered_fields) {
                if (updated_fields[field] === undefined) {
                    rendered_fields[field].remove();
                    delete rendered_fields[field];
                }
            }
        }
        else {
            //  this should never be called, as a persistant type
            //  cannot change its own type... hmmm, or should it
            //  be able to?!
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);

};
