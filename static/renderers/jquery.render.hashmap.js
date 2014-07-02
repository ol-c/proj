$(window).on('keydown keypress', function (e) {
    blocked = {
        "69" : true, // e
        "87" : true, // w
        "83" : true,  // s
        "119" : true
    };
    if (e.ctrlKey && blocked[e.which + '']) {
        e.preventDefault();
    }
});
               

(function () {

    function dragstart(d) {
        d.fixed = true;
    }

    var layout = d3.layout.force();
    var drag = layout.drag();
    drag.on("dragstart", dragstart);
    layout
        .gravity(0)
        .charge(-100)
        .linkDistance(100)
        .on('tick', tick);
    var node_data = layout.nodes();
    var link_data = layout.links();

    function tick(e) {
        var k = e.alpha * 100;
        for (var i=0; i<link_data.length; i++) {
            var l = link_data[i];
            l.source.x -= k;
            l.target.x += k;
        }

        function translate(d) {
            var translate =  'translate(' + Math.round(d.x) + 'px, ' + Math.round(d.y) + 'px);';
            return translate;
        }

        var styles = {
            position: 'fixed',
            top : 0,
            left : 0,
            display : 'inline-block',
            'background-color' :'rgba(255,255,255, .95)',
            padding : '1em',
            'box-shadow' : "0px 0px 32px rgba(200, 200, 200, 0.95)",
            border : '1px solid rgba(220, 220, 220, 0.5)'
        }

       var extra_styles = ""
       for (var style in styles) {
           extra_styles += style + ':' + styles[style] + ';';
       }

        node
            .filter(function (d) {
                if (d.rendered_version) {
                    var offset = d.container.offset();
                    d.x = offset.left;
                    d.y = offset.top;
                    return false;
                }
                else {
                    return true;
                }
             })
            .attr('style', function (d) {
                var trans = translate(d);
                var transforms = [
                    '-webkit-transform',
                    '-o-transform',
                    '-moz-transform',
                    '-ms-transform'
                ];
                var t = '';
                for (var i=0; i<transforms.length; i++) {
                    t += transforms[i] + ':' + trans;
                }
                return t + extra_styles;
            });
        

        link
            .attr('x1', function (d) { return d.source.x })
            .attr('y1', function (d) { return d.source.y })
            .attr('x2', function (d) { return d.target.x })
            .attr('y2', function (d) { return d.target.y });
    }

    function restart_layout() {
        link = link.data(link_data);
        link.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke-width', 5)
            .attr('stroke', 'Grey');

        node = node.data(node_data);
        node.enter()
            .append('div').attr('id', function (d) {
                return d.id;
            })
            .attr('class', 'node')
            .on("dblclick", function () {})
            .call(drag);

        layout.size([window.innerWidth, window.innerHeight]);
        layout.start();
    }

    var rendered = {};

    var last_node = {x : 0, y : 0};


    var svg;
    var link;
    var node;

    $(function () {
        svg = d3.select('body').append('svg')
            .attr("width", "100%")//window.innerWidth)
            .attr("height", "100%")//window.innerHeight);
            .attr("style", "pointer-events:none;z-index:9999;position:fixed; top:0; left:0;");

        link = svg.selectAll('.link');
        node = d3.select('body').selectAll('.node');
    });

    $.fn.render.hashmap = function (item, after) {
        var container = $('<div>');
        var rendered_node = {
            x : 0,
            y : 0,
            container : container,
            dragged : false,
            rendered_version : true
        };
        node_data.push(rendered_node);

        //  transparent border so can highlight without trouble
        container.css({
            display : 'inline-block',
            border : '2px solid rgba(0,0,0,0)'
        });
        this.append(container);
        var self = container;

        var highlighter;
        var unhighlighter;

        self.hammer().on('touch', function () {
            //self.trigger('select');
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

        function show_in_container(value) {
            var id = (Math.random() + '').slice(2);
            var source_node = {
                x : 0,
                y : 0,
                id : id,
                dragged : false,
                rendered_version : false
            };
            node_data.push(source_node);

            link_data.push({source : rendered_node, target : source_node});

            restart_layout();

            var container = $('#' + id);

            container.append(value);

            //container.css();

            return container;
        }
        var editing = false;
        var source = "if      (type(this.render) == 'function' ) return this.render();\n" +
                     "else if (type(this.render) == 'reference') return resolve(this.render);\n" +
                     "else                                       return undefined;"
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
                    renderable = "{&hellip;}";
                }
                self.append(renderable);
            }
            var generic_view = null;
            $(window).on('keydown', function (e) {
                if (self.selected() && e.ctrlKey && e.which == 69) {
                    e.preventDefault();
                    if (generic_view) {
                        generic_view.toggle();
                    }
                    else {
                        generic_view = show_in_container(render_generic());
                        generic_view.hammer().on('touch', function (e) {
                            //  TODO: select the command line for this
                            e.stopPropagation();
                        });
                        //  TODO: if source node already rendered somewhere else, use that
                    }
                }
                if (self.selected()) {
                    if (e.keyCode == 37) {
                        e.stopImmediatePropagation();
                        container.trigger('select_prev');
                    }
                    else if (e.keyCode == 39) {
                        e.stopImmediatePropagation();
                        container.trigger('select_next');
                    }
                }

            });
            //  selectable container
            self.selectable();
            highlighter = function () {
                self.css({
                    border : '2px solid orange'
                });
            };
            unhighlighter = function () {
                self.css({
                    border : '2px solid rgba(0,0,0,0)'
                })
            }
            self.on('select', function (e) {
                e.stopImmediatePropagation();
                highlight();
            });
            self.on('unselect', function (e) {
                e.stopImmediatePropagation();
                unhighlighter();
            });
            self.hammer().on('touch', function (e) {
                e.stopPropagation();
                self.trigger('select', {});
            });
        });

        function render_generic() {
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
                    color : 'lime',
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
                    value.render(item, after);
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
                        else if (
                        ((updated_fields[field] && updated_fields[field].internal) || (updated_fields[field].internal === undefined && item.data[field].internal === undefined))
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
