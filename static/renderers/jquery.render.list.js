(function () {
    var rendered = {};

    $.fn.render.list = function (item, after, parent_source) {

        var command_line = $('<span>');
        var node = new node_generator(parent_source);
        this.append(node.container());

        var self = node.container();


        renderable = $('<span>');
        renderable.text('list');
        self.append(renderable);

        node.render(render_generic);

        function render_generic() {
            var container = $("<div>");
            
            container.css({
                display : 'inline-block',
                verticalAlign : 'top',
                whiteSpace : 'pre',
                fontFamily : 'monospace'
            });

            container.on('select', function () {
                command_line.select();
            });

            var hashed_ref = hash_reference(item.reference);

            if (rendered[hashed_ref]) {
                var rendered_indicator = $('<div>').append("{&#8634;}");
                return container;
            }

            container.append(command_line);
            command_line.command(item);

            var rendered_fields = {};

            function render_item(key, reference, after) {
                //  TODO: show loader
                var field = $('<span>').text('[' + key + ']');
                var divider = $('<span> </span>');
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
                    color : 'slategrey',
                    marginLeft : (-key_width) + 'ch'
                });
                row.css({
                    paddingLeft : (key_width) +'ch',
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
            function render_list() {
                var id = item.reference[0].name;

                for (var i=0; i<item.data.length; i++) {
                    var key = i+'';
                    var reference = [
                        {name : id    , type : 'reference'},
                        {name : '' + i, type : 'reference'}
                    ];
                    var row = render_item(key, reference);
                    content_body.append(row);
                }
                var r = $('<span>');
                content_body.css({
                    marginTop : '1em'
                })
                r.append([command_line, content_body]);
                container.append(r);
            }
            render_list();

            function watch_fn(update) {
                if (update.value.type == 'list') {
                    if (update.value.operation == 'push') {
                        var args = update.value.arguments;
                        for (var i=0; i<args.length; i++) {
                            var reference = item.reference.concat([{
                                type : 'reference',
                                name : i + item.data.length
                            }]);
                            var new_render = render_item(item.data.length, reference);
                            content_body.append(new_render);
                            item.data.length += 1;
                        }
                    }
                    else if (update.value.operation == 'pop') {
                        if (item.data.length) {
                            item.data.length -= 1;
                            content_body.children().last().remove();
                        }
                    }
                    else if (update.value.operation == 'shift') {
                        if (item.data.length) {
                            item.data.length -= 1;
                            content_body.children().first().remove();
                            //  TODO: update indices
                        }
                    }
                    else if (update.value.operation == 'unshift') {
                        var args = update.value.arguments;
                        for (var i=args.length-1; i>=0; i--) {
                            var reference = item.reference.concat([{
                                type : 'reference',
                                name : i + ''
                            }]);
                            var new_render = render_item(i + '', reference);
                            content_body.prepend(new_render);
                            item.data.length += 1;
                        }
                        //  TODO: old update indices
                    }
                    else if (update.value.operation == 'reverse') {
                        var reversed = content_body.children().get().reverse();
                        content_body.append(reversed);
                        //  TODO: update indices;
                    }
                    else if (update.value.operation == 'sort') {
                        //  TODO: pass representation of sort operation
                        content_body.empty();
                        render_list();
                    }
                    else {
                        //  TODO: optimize...
                        content_body.empty();
                        item = update.value;
                        render_list();
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
            return container;
        }
    };

})();
