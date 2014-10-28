$.fn.render.ui = function (item, after, parent_source) {
    var self = this;
    var scale = 1;
    var x = item.x || window.innerWidth/8;
    var y = item.y || window.innerHeight/6;
    var w = item.w || window.innerWidth/2;
    var h = item.h || window.innerHeight*2/3;


    var directives = {};

    function change() {
        var value = content.text();
        if (directives[value.split('\n')[0]]) {
            
        }
        else {
            rendered.css({
                whiteSpace : 'pre'
            })
            rendered.text(value);
        }
    }

    var rendered = $('<div>').css({
        width : '100%',
        height : '100%'
    })

    var content = $('<div>').css({
        position : 'absolute',
        left : '100%',
        paddingLeft : '1em',
        top : 0
    });
    content.editor({
        placeholder : $('<span> >>> </span>')
    })

    content.on('change', change);

    var reference = item.reference;
    var surface = $('<div>').css({
        top : 0,
        left : 0,
        boxShadow : '0 0 32px #888888',
        position : 'absolute',
    });

    surface.append([rendered, content]);

    function apply_transform() {
        surface.css({
            width : w,
            height : h,
            transform : 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')'
        })
    }

    apply_transform();

    self.append(surface);

    surface.bind('dblclick', function (e) {
        e.stopPropagation();
        var container = $('<div>');
        var w = 100;
        var h = 100;
        var child_x = e.clientX - x - 50;
        var child_y = e.clientY - y  - 50;
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
            var parent_offset = $(this).parent().offset();
            var ox = last_x - parent_offset.left - child_x;
            var oy = last_y - parent_offset.top - child_y;
            var edge = {
                left : ox < resize_target && ox > 0,
                top : oy < resize_target && oy > 0 && ox < w,
                right : ox > w - resize_target && ox < w,
                bottom : oy > h - resize_target && oy < h && ox < w
            };
            var interior = ox > resize_target && ox < w - resize_target && oy > resize_target && oy < h - resize_target;

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
                }
                else if (edge.right) {
                    w += delta_x;
                    if (w < 2*resize_target) child_x += w - 2*resize_target;
                }

                if (edge.top) {
                    child_y += delta_y;
                    h -= delta_y;
                }
                else if (edge.bottom) {
                    h += delta_y;
                    if (h < 2*resize_target) child_y += h - 2*resize_target;
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
            }
        };

        container.on('mousedown', start_drag);
        surface.append(container);
        var parent_offset = self.parent().offset();
        var node = new node_generator(parent_source);
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
