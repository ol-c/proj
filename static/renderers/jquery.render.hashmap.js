(function () {

    var rendered = {};

    $.fn.render.hashmap = function (item, after) {
        var container = $("<div>");
        var highlight;
        var unhighlight;
        var command_line;
        command_line = $('<span>');
        
        container.css({
            display : 'inline-block',
            verticalAlign : 'top'
        });

        var hashed_ref = hash_reference(item.reference);


        if (rendered[hashed_ref]) {

            container.hammer().on('touch', function () {
                container.trigger('select');
            });
            var timeouts = [];
            function highlight() {
                var time_on = 1000;
                var time_off = 500;
                if (container.selected()) {
                    while (timeouts.length) {
                        clearTimeout(timeouts.pop());
                    }
                    if (highlighter) highlighter();
                    timeouts.push(setTimeout(function () {
                        if (unhighlighter) unhighlighter()
                        timeouts.push(setTimeout(highlight, time_off));
                    }, time_on));
                }
                else {
                    if (unhighlighter) unhighlighter();
                }
            }

            var rendered_indicator = $('<div>').append("{&#8634;}");
            
            container.append(rendered_indicator);

            container.selectable();
            container.on('select', function () {
                highlight();
            });
            container.on('unselect', function () {
                unhighlighter();
            });
            $(window).on('keydown', function (e) {
                if (container.selected()) {
                    if (e.keyCode == 37) {
                        container.trigger('select_prev');
                    }
                    else if (e.keyCode == 39) {
                        container.trigger('select_next');
                    }
                    else if (e.keyCode == 13) {
                        rendered[hashed_ref].trigger('select');
                    }
                }
            });
            highlighter = function () {
                container.css({
                    background : 'orange'
                });
            }
            unhighlighter = function () {
                container.css({
                    background : 'none'
                });
            }


            this.append(container);

            return;
        }
       
        rendered[hashed_ref] = command_line;

        var self = this;
        container.css({
            whiteSpace : 'pre',
            fontFamily : 'monospace',
        });
        self.append(container);

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
                marginLeft : (-key_width) + 'ch'
            });
            row.css({
                paddingLeft : (4 + key_width) +'ch',
                paddingTop : '0.25em',
                paddingBottom : '0.25em'
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
            command_line.command(item, user_context(item));
            open.append(command_line)
            var close = $('<span>}</span>').append(after);
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
            var r = $('<span>');
            r.append([open, content_body, close]);
            container.append(r);
        }
        $(this).append(container);
        render_hashmap();


        function watch_fn(update) {
            if (update.value.type == 'hashmap') {
                var updated_fields = update.value.data;
                var field;
                for (field in updated_fields) {
                    if (rendered_fields[field] === undefined) {
                        var after;
                        if (Object.keys(rendered_fields).length) {
                            after = $('<span>,</span>');
                            after.css({
                                color : '#888888'
                            });
                        }
                        var r = render_field(field, updated_fields[field], after);
                        content_body.prepend(r);
                    }
                }
                for (field in rendered_fields) {
                    if (updated_fields[field] === undefined) {
                        rendered_fields[field].remove();
                        delete rendered_fields[field];
                    }
                    //  necessary since references to objects inside of objects are still absolute
                    //  this will see if a reference was changed, indicating a need to refresh the field
                    //  internal condition to make sure the value we are updating to is a container type (other types handle updates themselves)
                    else if (
                   (updated_fields[field].internal || (updated_fields[field].internal === undefined && item.data[field].internal === undefined))
                    && hash_reference(updated_fields[field]) !== hash_reference(item.data[field])) {
                        // TODO: after char
                        var old = rendered_fields[field];
                        delete rendered_fields[field];
                        old.before(render_field(field, updated_fields[field]));
                        old.remove();
                    }
                }
                item.data = updated_fields;
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

})();
