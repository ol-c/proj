(function () {
    var rendered = {};

    $.fn.render.list = function (item, after, parent_source) {
        var reference = item.reference;

        var rendered_fields = {};
        var renderings = [];
        var key_class = (Math.random() + '').slice(2);
        var content_body = $('<div>');
        var container = $("<div>");

        var command_line = $('<span>');
        var node = new node_generator(parent_source);
        this.append(node.container());

        var self = node.container();

        renderable = $('<span>');
        renderable.text('list');
        self.append(renderable);

        node.render(render_generic);

        function render_generic() {
            rendered = true;

            container.css({
                display : 'inline-block',
                verticalAlign : 'top',
                whiteSpace : 'pre',
                fontFamily : 'monospace'
            });

            container.on('select', function () {
                command_line.select();
            });

            var hashed_ref = hash_reference(reference);

            if (rendered[hashed_ref]) {
                var rendered_indicator = $('<div>').append("{&#8634;}");
                return container;
            }

            container.append(command_line);
            command_line.command(item);
            render_list();

            return container;
        }

        function update_keys() {
            $('.' + key_class).each(function (i, el) {
                $(el).text('[' + i + ']');
            });
        }

        function render_list() {
            var id = reference[0].name;

            for (var i=0; i<item.data.length; i++) {
                var key = i+'';
                var ref = [
                    {name : id    , type : 'reference'},
                    {name : '' + i, type : 'reference'}
                ];
                var row = render_item(key, ref);
                content_body.append(row);
            }
            var r = $('<span>');
            content_body.css({
                marginTop : '1em'
            })
            r.append([command_line, content_body]);
            container.append(r);
        }

        function render_item(key, item_reference, after, prepend) {
            //  TODO: show loader
            var field = $('<span>');
            var key_holder = $('<span>').text('[' + key + ']');
            key_holder.addClass(key_class);
            field.append(key_holder);
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


            var render_data = value.render({
                type : 'loader',
                reference : item_reference
            }, after, node.node());

            //  render item is always executed in order
            //  so we can just push a placehoder into the
            //  renderings list
            //  (to handle ordering changes between async)
           
            if (prepend) renderings.unshift(render_data);
            else         renderings.push(render_data);
            
            rendered_fields[key] = row;

            return row;
        }

        var rendered = false;


        function watch_fn(update) {
            if (update.value.type == 'list') {
                if (update.value.operation == 'push') {
                    console.log('pushed!')
                    var args = update.value.arguments;
                    for (var i=0; i<args.length; i++) {
                        if (rendered) {
                            var ref = reference.concat([{
                                type : 'reference',
                                name : i + item.data.length
                            }]);
       
                            var new_render = render_item(item.data.length, ref);
                            content_body.append(new_render);
                        }
                        item.data.length += 1;
                    }
                }
                else if (update.value.operation == 'pop') {
                    if (item.data.length) {
                        item.data.length -= 1;
                        if (rendered) {
                            content_body.children().last().remove();
                        }
                    }
                }
                else if (update.value.operation == 'shift') {
                    //  TODO rebind watching references
                    if (item.data.length) {
                        item.data.length -= 1;
                        if (rendered) {
                            content_body.children().first().remove();
                            renderings.shift()
                            update_keys();
                            for (var i=0; i<renderings.length; i++) {
                                renderings[i].change_reference([reference[0]].concat([
                                    {type : 'reference', name : i + '' }
                                ]));
                            }
                        }
                    }
                }
                else if (update.value.operation == 'unshift') {
                    //  TODO: rebind watching references
                    var args = update.value.arguments;
                    for (var i=args.length-1; i>=0; i--) {
                        if (rendered) {
                            var ref = reference.concat([{
                                type : 'reference',
                                name : i + ''
                            }]);
                            var new_render = render_item(i + '', ref, undefined, true);
                            content_body.prepend(new_render);
                        }
                        item.data.length += 1;
                    }
                    for (var i=args.length; i<renderings.length; i++) {
                        if (rendered) {
                            renderings[i].change_reference([reference[0]].concat([
                                {type : 'reference', name : i + '' }
                            ]));
                        }
                    }

                    update_keys();
                }
                else if (update.value.operation == 'reverse') {
                    //  TODO: rebind watching references
                    if (rendered) {
                        var reversed = content_body.children().get().reverse();
                        content_body.append(reversed);
                        update_keys()
                        renderings.reverse();
                        for (var i=0; i<renderings.length; i++) {
                            renderings[i].change_reference([reference[0]].concat([
                                {type : 'reference', name : i + '' }
                            ]));
                        }
                    }
                }
                else if (update.value.operation == 'sort') {
                    //  TODO: optimize by passing a
                    //        representation of sort
                    //        operation and following suit
                    //        with already rendered versions
                    if (rendered) {
                        content_body.empty();
                        render_list();
                    }
                }
                else {
                    if (update.value.data.length !== item.data.length) {
                        //  TODO: optimize...
                        item = update.value;
                        if (rendered) {
                            content_body.empty();
                            render_list();
                        }
                    }
                    else {
                        //  if length did not change, then an internal reference has
                        //  changed and the rendered version of it will handle that
                    }
                }
            }
            else {
                self.empty();
                self.render(update.value, after);
                unwatch(reference, watch_fn);
            }
        }

        watch(reference, watch_fn);
        
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
