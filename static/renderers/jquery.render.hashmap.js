(function () {
    var rendered = {};

    $.fn.render.hashmap = function (item, after, parent_source) {

        var command_line = $('<span>');
        var node = new node_generator(parent_source);
        this.append(node.container());

        var self = node.container();

        var source = "if (type(this.render) == 'function' ) return this.render();\n" +
                     "else if (type(this.render) == 'reference') return resolve(this.render);\n" +
                     "else return undefined;";

        evaluate_script(item.reference, source, function (result) {
            if (result.type == 'error') {
                self.render(result);
            }
            else {
                var renderable;
                if (result.value.type == "string") {
                    renderable = result.value.data;
                }
                else if (result.value.type == 'reference') {
                    renderable = "loader...";
                }
                else {
                    renderable = $('<span>');
                    renderable.text('hashmap');
                }
                self.append(renderable);
            }
        });


        node.render(render_generic);


        function render_generic() {
            var container = $("<div>");
            var highlight;
            var unhighlight;
            
            container.css({
                display : 'inline-block',
                verticalAlign : 'top'
            });

            container.on('select', function () {
                command_line.select();
            });

            var hashed_ref = hash_reference(item.reference);

            if (rendered[hashed_ref]) {
                var rendered_indicator = $('<div>').append("{&#8634;}");
                return container;
            }

            rendered[hashed_ref] = command_line;

            container.css({
                whiteSpace : 'pre',
                fontFamily : 'monospace',
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
                    color : 'limegreen',
                    marginLeft : (-key_width) + 'ch'
                });
                row.css({
                    paddingLeft : (4 + key_width) +'ch',
                    paddingTop : '0.5em',
                    paddingBottom : '0.5em'
                });

                perform_operation({
                    type : 'source reference',
                    reference : reference
                }, function (item) {
                    value.render(item, after, node.node());
                });
                
                rendered_fields[key] = row;

                return row;
            }

            var content_body = $('<div>');
            function render_hashmap() {
                var open = $('<span>{</span>');
                command_line.command(item);
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
            return container;
        }
    };

})();
