$.fn.render.ui = function (item, after, parent_source) {
    var reference = item.reference;
    var parent_node = new node_generator(parent_source, hash_reference(reference));
    var self = parent_node.container();
    parent_node.render(render_container);

    if (parent_source) {
    }
    else {
        parent_node.show();
    }

    function render_container() {
        var directives = [
            [/^\s*\/\/\s*(javascript|js)/, function (value) {
                move_content_right();
                content.trigger('highlight', 'javascript');
                var val;
                try {
                    return eval('(function () {\n' + value + '\n})()');
                }
                catch (error) {
                    console.log(error);
                }
            }]
        ];

        function move_content_right() {
            content.css({
                left : '100%',
                top : 0,
                position : 'absolute',
                padding : 0,
                paddingLeft : '4ch'
            });
        }
        function reset_content() {
            content.css({
                position : '',
                display : 'inline-block',
                left : 0,
                top : 0,
                paddingLeft : 0
            })
        }

        function change() {
            var value = content.text();
            var directive_used = false;
            for (var i=0; i<directives.length; i++) {
                if (directives[i][0].test(value)) {
                    var rendering = directives[i][1](value);
                    if (rendering) {
                        rendered.empty();
                        rendered.append(rendering);
                    }
                    directive_used = true;
                    break;
                }
            }
            if (!directive_used) {
                content.trigger('highlight', 'none');
                rendered.empty();
                reset_content();
            }

        }

        var content = $('<div>');
        content.editor({
            placeholder : $('<div></div>').css({
                color : '#888888',
                padding : '4ch'
            })
        })

        content.on('change', change);

        var surface = $('<div>');
        var rendered = $('<div>');

        surface.append([rendered, content]);

        surface.bind('dblclick', function (e) {
            e.stopPropagation();
            var container = $('<div>');
            var w = 100;
            var h = 100;
            var child_x = e.clientX - parent_node.node().x - w/2;
            var child_y = e.clientY - parent_node.node().y + parent_node.node().h/2  - h/2;
            container.css({
                border : '1px solid black',
                position : 'absolute',
            });

            apply_transform();

            function apply_transform() {
                container.css({
                    width : w,
                    height : h,
                    left : child_x,
                    top : child_y
                })
            }

            function start_drag (e) {
                e.stopPropagation();
                var resize_target = 32;
                var last_x = e.clientX;
                var last_y = e.clientY;
                var target = this;
                var parent_offset = $(this).parent().offset();
                var ox = last_x - parent_offset.left - child_x;
                var oy = last_y - parent_offset.top - child_y;
                var interior = ox > resize_target && ox < w - resize_target && oy > resize_target && oy < h - resize_target;
                var edge = get_edge(e);
                
                function get_edge(e) {
                    last_x = e.clientX;
                    last_y = e.clientY;
                    parent_offset = $(target).parent().offset();
                    ox = last_x - parent_offset.left - child_x;
                    oy = last_y - parent_offset.top - child_y;
                    interior = ox > resize_target && ox < w - resize_target && oy > resize_target && oy < h - resize_target;

                    return {
                        left : ox < resize_target && ox > 0,
                        top : oy < resize_target && oy > 0 && ox < w,
                        right : ox > w - resize_target && ox < w,
                        bottom : oy > h - resize_target && oy < h && ox < w
                    };
                }

                $(window).bind('mousemove', drag);
                $(window).one('mouseup', function () {
                    $(window).unbind('mousemove', drag);
                });

                function drag(e) {
                    var delta_x = e.clientX - last_x;
                    var delta_y = e.clientY - last_y;
                    
                    if (edge.left) {
                        w -= delta_x;
                        child_x += delta_x;
                        if (w < 2*resize_target) {
                            child_x -= 2*resize_target - w;
                        }
                    }
                    else if (edge.right) {
                        w += delta_x;
                    }

                    if (edge.top) {
                        child_y += delta_y;
                        h -= delta_y;
                        if (h < 2*resize_target) {
                            child_y -= 2*resize_target - h;
                        }
                    }
                    else if (edge.bottom) {
                        h += delta_y;
                    }
                    w = Math.max(2*resize_target, w);
                    h = Math.max(2*resize_target, h);

                    if (interior) {
                        child_x += delta_x;
                        child_y += delta_y;
                    }

                    apply_transform();

                    last_x += delta_x;
                    last_y += delta_y;
                //    edge = get_edge(e);
                }
            };

            container.on('mousedown', start_drag);
            surface.append(container);
            var parent_offset = self.parent().offset();
            var node = new node_generator(parent_source, hash_reference(reference));
            node.render(function () {
                var rendered_node = $('<div>');
                rendered_node.render({
                    type : 'ui',
                    x : e.clientX - x - parent_offset.left - 32,
                    y : e.clientY - y - parent_offset.top - 32,
                    w : 64,
                    h : 64
                });
                return rendered_node;
            })
        });
        return surface;
    }

    function watch_fn(update) {
        if (update.value.type == 'ui') {
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
