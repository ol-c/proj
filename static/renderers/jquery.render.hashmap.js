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

    var root_source;

    var last_fixed = null;

    function dragstart(d) {
        if (last_fixed) last_fixed.fixed = false;
        d3.select(this).classed('fixed', d.fixed = true);
        last_fixed = d;
    }

    var layout = d3.layout.force();
    var drag = layout.drag();
    drag.on("dragstart", dragstart);
    layout
        .friction(0.8)
        .gravity(0.001)
        .charge(function (d) {
            //  rendered versions shouldn't push since they are constrained
            return -1000;
        })
        .linkDistance(function (d) {
            var sw = d.source.container.outerWidth();
            var sh = d.source.container.outerHeight();

            var tw = d.target.container.outerWidth();
            var th = d.target.container.outerHeight();

            return (sw + tw)/2;//Math.sqrt(sw*sw + sh*sh)/2 + tw/2;//Math.sqrt(tw*tw + th*th)/2;
        })
        .linkStrength(function (d) {
            return 3;
        })
        .on('tick', tick);
    var node_data = layout.nodes();
    var link_data = layout.links();

    function tick(e) {
        //  TODO: Attractive force toward fixed nodes.
        function recommended_offset(link) {

            var siblings = [];

            for (var i=0; i<link.source.children.length; i++) {
                var sibling = link.source.children[i];
                if (sibling.source_visible) {
                    siblings.push(sibling);
                }
            }

            var sibling_index = 0;
            var sibling_heights = [];
            var sibling_y = 0;
            var sibling_spacing = 0;

            for (var i=0; i<siblings.length; i++) {
                sibling_heights.push(siblings[i].container.outerHeight() + sibling_spacing);
                if (siblings[i] == link.target) {
                    sibling_index = i;
                }
            }

            var total_height = 0;

            for (var i=0; i<siblings.length; i++) {
                total_height += sibling_heights[i];
                if (i == sibling_index) {
                    sibling_y = total_height - sibling_heights[i]/2;
                }
            }

            var sw = link.source.container.outerWidth();
            var sh = link.source.container.outerHeight();

            var tw = link.target.container.outerWidth();
            var th = link.target.container.outerHeight();

            var dx = (sw + tw)/2;//Math.sqrt(sw*sw + sh*sh)/2 + Math.sqrt(tw*tw + th*th)/2;
            var dy = sibling_y - total_height/2;

            return {
                dx : dx,
                dy : dy
            };
        }


        link.each(function (l) {
            //  fixed targets don't need adjustment
            if (l.target.fixed) return;

            //  adjust source and target to fit the reccomended dimensions
            var r = recommended_offset(l);

            var rendered_children = [];

            for (var i=0; i<l.source.children.length; i++) {
                if (l.source.children[i].source_visible) {
                    rendered_children.push(l.source.children[i]);
                }
            }

            var k = e.alpha;

            l.target.x += r.dx/2 * k;
            l.target.y += r.dy/2 * k;
            l.source.x -= r.dx/rendered_children.length/2 * k;
            l.source.y -= r.dy/rendered_children.length/2 * k;
            //  TODO: if going to move source, need to do it once for all children
            //  TODO use this technique to coax children in a fan around parent
        });

        function translate(d) {
            var x = Math.round(d.x);
            var y = Math.round(d.y);
            y -= d.container.outerHeight()/2;
            x -= d.container.outerWidth() /2;
            var translate =  'translate(' + x + 'px, ' + y + 'px);';
            return translate;
        }

        var styles = {
            position: 'fixed',
            top : 0,
            left : 0,
            margin : 0,
            'background-color' :'rgba(255,255,255, .95)',
            padding : '1em',
            'box-shadow' : "0px 0px 32px rgba(200, 200, 200, 0.95)",
            border : '1px solid rgba(220, 220, 220, 0.5)',
        }

        var extra_styles = ""
        for (var style in styles) {
            extra_styles += style + ':' + styles[style] + ';';
        }

        node
           .each(function (d) {
               if (d.root && !d.fixed) {
                   //  push root toward left of screen
                   var k = e.alpha;
                   d.x -= k * (d.x - d.container.outerWidth()/2 - window.innerWidth / 16);
                   d.y -= k * (d.y - window.innerHeight / 2);
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
                //  TODO: apply these styles to the div inside of this foreign object
                //  Want this inside of svg document so we can respect layering
                var s = extra_styles + t + 'display:' + (d.visible ? "inline-block" : "none");
                $('#'+ d.id).attr('style', s);
                return '';//extra_styles + t;
            });
        

        link
            .attr('x1', function (d) { return d.rendered_element.offset().left + d.rendered_element.outerWidth()/2; })
            .attr('y1', function (d) { return d.rendered_element.offset().top + d.rendered_element.outerHeight()/2; })
            .attr('x2', function (d) { return Math.round(d.target.x); })
            .attr('y2', function (d) { return Math.round(d.target.y); })
            .attr('style', function (d) {
                var sw = d.rendered_element.outerWidth();
                var sh = d.rendered_element.outerHeight();
                var offset = d.rendered_element.offset();
                var sx = offset.left;
                var sy = offset.top;

                var tw = d.target.container.outerWidth();
                var th = d.target.container.outerHeight();

                var tx = d.target.x - tw/2;
                var ty = d.target.y - th/2;
/*
                d.source_mask
                    .attr('x', sx)
                    .attr('y', sy)
                    .attr('width', sw)
                    .attr('height', sh)

                d.target_mask
                    .attr('x', tx)
                    .attr('y', ty)
                    .attr('width', tw)
                    .attr('height', th)
*/
                return "";
            })
    }

    function initialize_links_and_nodes() {
        link = link.data(link_data);
        link.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke-width', 5)
            .attr('stroke', 'rgba(128, 128, 128, 0.30)')
            .attr('mask', function (d) {
                //  create a mask for the link 
                var id = (Math.random() + '').slice(2);

                var mask = defs.append('mask');
                mask
                    .attr('id', id)
                    .append('rect')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('fill', 'white');
                    
                var target_mask = mask.append('rect');
                var source_mask = mask.append('rect');

                d.source_mask = source_mask;
                d.target_mask = target_mask;

                return 'url(#' + id + ')';
            });

        node = node.data(node_data);
        node.enter()
            .append('svg:foreignObject')
            .attr('pointer-events', 'all')
            .attr('width', '100%')
            .attr('height', '100%')
            .append('xhtml:div')
            .attr('id', function (d) {
                return d.id
            })
            .attr('class', 'node')
            .attr('xmlns', "http://www.w3.org/1999/xhtml")
            .on("dblclick", function (d) {

            })
            .call(drag);
    }

    function restart_layout() {
        layout.size([window.innerWidth * 20, window.innerHeight]);
        layout.start();
    }

    var rendered = {};

    var last_node = {x : 0, y : 0};

    $(window).on('resize', function () {
        restart_layout();
    });


    var svg;
    var link;
    var node;
    var defs;

    $(function () {
        svg = d3.select('body').append('svg')
            .attr("pointer-events", "none")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("style", "z-index:1;position:fixed; top:0; left:0;");

        defs = svg.append('defs');

        link = svg.selectAll('.link');
        node = svg.selectAll('.node');
    });













    $.fn.render.hashmap = function (item, after, parent_source) {
        var container = $('<div>');
        var command_line = $('<span>');

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

        var source_node =  {
            x : 0,
            y : 0,
            id : (Math.random() + '').slice(2),
            rendered_version : false,
            children : []
        };

        if (parent_source) {
            parent_source.children.push(source_node);
        }
        else {
            source_node.root = true;
        }

        function show_in_container(value) {
            node_data.push(source_node);

            if (root_source) {
                if (parent_source) {
                    var offset = self.offset();
                    source_node.source_visible = true;
                    source_node.x = offset.left + self.outerWidth() + 256;
                    source_node.y = offset.top + self.outerHeight() / 2
                    link_data.push({source : parent_source, target : source_node, rendered_element : self});
                }
            }
            else {
                source_node.x = window.innerWidth/3;
                source_node.y = window.innerHeight/2;
                source_node.root = true;
                root_source = source_node;
            }

            initialize_links_and_nodes();

            var container = $('#' + source_node.id);
            container.css({
                display : 'inline-block',
                position : 'absolute'
            });

            //  when container changes dimensions, restart layout
            var old_width = container.outerWidth();
            var old_height = container.outerHeight();
            function check_dimensions() {
                var current_width = container.outerWidth();
                var current_height = container.outerHeight();
                if (old_width !== current_width || old_height !== current_height) {
                    restart_layout();
                    old_width = current_width;
                    old_height = current_height;
                }
                setTimeout(check_dimensions, 50);
            }

            check_dimensions();

            source_node.container = container;

            container.append(value);
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
            var collapsed = true;
            $(window).on('keydown', function (e) {
                if (self.selected() && e.keyCode == 13) {
                    e.preventDefault();
                    if (generic_view) {
                        if (collapsed) {
                            source_node.visible = true;
                        }
                        else {
                            source_node.visible = false;
                        }
                        collapsed = !collapsed;
                        restart_layout();
                    }
                    else {
                        source_node.visible = true;
                        generic_view = show_in_container(render_generic());
                        generic_view.hammer().on('touch', function (e) {
                            //  TODO: select the command line for this
                            command_line.trigger('select', {});
                            e.stopPropagation();
                        });
                        collapsed = false;
                        //command_line.trigger('select', {});
                        restart_layout();
                        //  TODO: if source node already rendered somewhere else, use that
                    }
                }
                else if (self.selected() && e.ctrlKey && e.keyCode == 39) {
                    e.preventDefault();
                    command_line.trigger('select', {})
                }
                //  TODO: if child selected and ctrl+left is pressed then jump to the rendered version
                else if (self.selected()) {
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
                    if (item.type == 'hashmap') {
                        value.render(item, after, source_node);
                    }
                    else value.render(item, after);
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
