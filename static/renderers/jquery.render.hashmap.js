(function () {
    var rendered = {};

    $.fn.render.hashmap = function (item, after, parent_source, options) {
        var reference = item.reference;

        var tag = hash_reference(reference);
        if (tagged_node(tag)) {
            console.log(tagged_node(tag));
            return;
        }
        var node = new node_generator(parent_source);
        tag_node(node, tag);

        var rendered_fields = {};
        var rendered;
        var content_body = $('<div>');

        var command_line = $('<span>');
        var self = node.container();
        node.render(render_generic);

        if (parent_source) {
            this.append(self);
            var placeholder = 'item';
            if (options && options.placeholder) placeholder = options.placeholder;
            self.append(placeholder);
        }
        else {
            //  don't need original element, just show root
            node.show();
        }
        
        watch(reference, watch_fn);

        function render_generic() {
            rendered = true;
            var container = $("<div>");
            var highlight;
            var unhighlight;
            
            container.css({
                display : 'inline-block',
                verticalAlign : 'top',
                padding : '4ch'
            });

            container.on('select', function () {
                command_line.select();
            });

            var hashed_ref = hash_reference(item.reference);
            //  TODO: draw unique arcs between renderings of same things

            rendered[hashed_ref] = command_line;

            container.css({
                whiteSpace : 'pre',
                fontFamily : 'monospace',
            });

            function render_hashmap() {
                command_line.command(item);
                var keys = Object.keys(item.data);
                keys.reverse();

                for (var i=0; i<keys.length; i++) {
                    var key = keys[i];
                    var row = render_field(key, item.data[key]);
                    content_body.append(row);
                }
                var r = $('<span>');
                content_body.css({
                    marginTop : '1em'
                })
                r.append([command_line, content_body]);
                container.append(r);
            }
            render_hashmap();

            return container;
        }
        

        function render_field(key, reference, after) {
            var field = $('<span>').text('"' + key.replace('"', '\\"') + '"');
            var divider = $('<span> &rarr; </span>');
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
                color : 'limegreen',
                marginLeft : (-key_width) + 'ch'
            });
            row.css({
                paddingLeft : (key_width) +'ch',
                paddingTop : '0.5em',
                paddingBottom : '0.5em'
            });

            value.render({type : 'loader', reference : reference}, after, node.node())
            
            rendered_fields[key] = row;

            return row;
        }

        function watch_fn(update) {
            if (update.value.type == 'hashmap') {
                var updated_fields = update.value.data;
                if (rendered) {
                    var field;
                    for (field in updated_fields) {
                        if (rendered_fields[field] === undefined) {
                            var r = render_field(field, updated_fields[field]);
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
                        //  TODO: clean up cases
                        else if (
                        (updated_fields[field] && (updated_fields[field].internal || updated_fields[field].internal === undefined && (item.data[field] && item.data[field].internal === undefined)))
                        && item.data[field] && hash_reference(updated_fields[field]) !== hash_reference(item.data[field])) {
                            // TODO: after char
                            var old = rendered_fields[field];
                            delete rendered_fields[field];
                            old.before(render_field(field, updated_fields[field]));
                            old.remove();
                        }
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
                unwatch(reference, watch_fn);
            }
        }

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
})();
