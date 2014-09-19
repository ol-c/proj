var layout = {};

(function () {

    var last_fixed = null;

    var overlay;
    var link;
    var node;
    var defs;

    var force_layout = d3.layout.force();
    var drag = force_layout.drag();
    var node_data = force_layout.nodes();
    var link_data = force_layout.links();

    force_layout
        .friction(0.8)
        .gravity(0.0000000000001)
        .charge(function (d) {
            //  rendered versions shouldn't push since they are constrained
            return -1000;
        })
        .linkDistance(function (d) {
            //  perfect length for recommended offset;
            var o = recommended_offset(d);
            return Math.sqrt(o.dx*o.dx + o.dy*o.dy);
        })
        .linkStrength(function (d) {
            return 3;
        })
        .on('tick', tick);


    layout.add_node = function (node) {
        node_data.push(node);
        initialize_links_and_nodes();

        var container = $('#' + node.id);

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
                layout.restart();
                old_width = current_width;
                old_height = current_height;
            }
            setTimeout(check_dimensions, 50);
        }
        check_dimensions();
        node.container = container;
    };

    layout.add_link = function (link) {
        link_data.push(link);
        initialize_links_and_nodes();
    };

    layout.restart = restart_layout;
    layout.resume = function () {
        force_layout.resume();
    }
    layout.restart = function () {
        force_layout.start();
    }
    var offset = {x:0, y:0};
    layout.offset = function (dx, dy) {
        offset.x += dx;
        offset.y += dy;
        force_layout.resume();
        force_layout.tick();
        offset.x = 0;
        offset.y = 0;
    }


    function dragstart(d) {
        layout.fix(d);
    }

    layout.fix = function(d) {
        if (last_fixed) last_fixed.fixed = false;
        d.fixed = true;
        last_fixed = d;
    }

    drag.on("dragstart", dragstart);

    function tick(e) {
        //  TODO: force nodes off of eachother
        if (offset.x || offset.y) {
            node.each(function (d) {
                d.x += offset.x;
                d.y += offset.y;
                d.px += offset.x;
                d.py += offset.y;
            });
            return;
        }


        link.each(function (l) {
            //  fixed targets don't need adjustment
            if (l.target.fixed) return;

            //  adjust source and target to fit the recommended dimensions
            var r = recommended_offset(l);

            var rendered_children = [];

            for (var i=0; i<l.source.children.length; i++) {
                if (l.source.children[i].source_visible) {
                    rendered_children.push(l.source.children[i]);
                }
            }

            var k = e.alpha;

            if (l.target.fixed) {}
            else {
                l.target.x += r.dx/2 * k;
                l.target.y += r.dy/2 * k;
            }

            if (l.source.fixed) {}
            else {
                l.source.x -= r.dx/rendered_children.length/2 * k;
                l.source.y -= r.dy/rendered_children.length/2 * k;
            }
        });

        function translate(d) {
            var x = Math.round(d.x);
            var y = Math.round(d.y);
            // avoid scale stringifying with eX or e-X
            var scale = Math.round(d.scale * 1000)/1000;
            y -= d.container.outerHeight()/2;
            //x -= d.container.outerWidth() /2;
            var translate =  'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ');';
            return translate;
        }

        var styles = {
            position: 'absolute',
            'z-index' : 'inherit',
            top : 0,
            left : 0,
            margin : 0,
            'background-color' :'rgba(255,255,255, .95)',
            padding : '4ch',
            'box-shadow' : "0px 0px 32px rgba(200, 200, 200, 0.95)",
            border : '1px solid rgba(220, 220, 220, 0.5)',
            'font-size' : '12px',
            'font-family' : 'monospace',
            'white-space' : 'pre',
            '-webkit-transform-origin' : '0% 50%',
            '-o-transform-origin' : '0% 50%',
            '-moz-transform-origin' : '0% 50%',
            '-ms-transform-origin' : '0% 50%',
            'transform-origin' : '0% 50%',
        }

        var extra_styles = "";
        for (var style in styles) {
            extra_styles += style + ':' + styles[style] + ';';
        }

        node
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
                var s = extra_styles + t + 'display:' + (d.visible ? "inline-block" : "none")  + '; opacity:' + d.opacity + ';';
                $('#'+ d.id).attr('style', s);
                return '';//extra_styles + t;
            });
        
        var scroll_left = $(window).scrollLeft();
        var scroll_top  = $(window).scrollTop();

        link
            .attr('x1', function (d) { return d.rendered_element.offset().left - scroll_left + d.rendered_element.outerWidth() * d.source.scale; })
            .attr('y1', function (d) { return d.rendered_element.offset().top - scroll_top + d.rendered_element.outerHeight()/2 * d.source.scale; })
            .attr('x2', function (d) { return Math.round(d.target.x + d.target.container.width()/2 * d.target.scale); })
            .attr('y2', function (d) { return Math.round(d.target.y); })
            .each(function (d) {
                var sw = d.rendered_element.outerWidth();
                var sh = d.rendered_element.outerHeight();
                var element_offset = d.rendered_element.offset();
                var sx = element_offset.left - scroll_left;
                var sy = element_offset.top  - scroll_top;

                var tw = d.target.container.outerWidth() * d.target.scale;
                var th = d.target.container.outerHeight() * d.target.scale;

                var tx = d.target.x;
                var ty = d.target.y - th/2;
/*
                d.source_mask
                    .attr('x', sx)
                    .attr('y', sy)
                    .attr('width', sw)
                    .attr('height', sh)
*/
                d.target_mask
                    .attr('x', tx)
                    .attr('y', ty)
                    .attr('width', tw)
                    .attr('height', th)
                    .attr('fill', 'rgba(0,0,0,' + parseInt(d.target.opacity * 255) + ')')
            })
    }

    function initialize_links_and_nodes() {

        node = node.data(node_data);
        var node_parent = node.enter().append('div');

        node_parent
            .style('position', 'absolute')
            .style('left', '0')
            .style('top', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('pointer-events', 'none')
            .append('div')
            .attr('id', function (d) {
                return d.id
            })
            .attr('class', 'node')
            .call(drag);

        node_parent
            .append('svg')
            .attr('width', window.innerWidth)
            .attr('height', window.innerHeight)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('pointer-events', 'none')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .attr('id', function (d) {
                return 'svg-' + d.id;
            });


        link = link.data(link_data);
        link.enter()
            .append('svg:line')
            .attr('stroke-linecap', 'round')
            .attr('mask', function (d) {
                d.defs = d3.select('#svg-' + d.target.id).append('defs');
                //  create a mask for the link 
                var id = (Math.random() + '').slice(2);
                var mask = d.defs.append('mask');
               
                rect = mask
                    .attr('id', id)
                    .append('rect')

                rect
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('fill', 'white');
                    
                d.source_mask = mask.append('rect');
                d.target_mask = mask.append('rect');

                d.source_mask.attr('fill', 'rgba(0,0,0,255)');
                d.target_mask.attr('fill', 'rgba(0,0,0,255)');

                return 'url(#' + id + ')';
            })
            .attr('id', function (d) {
                d.id = (Math.random() + '').slice(2);
                return d.id;
            })
            .attr('class', 'link')
            .attr('stroke-width', 5)
            .attr('stroke', 'rgba(128, 128, 128, 0.10)')
            .each(function (d) {
                //  append link to the source node's g element
                $('#svg-' + d.target.id).append($('#' + d.id));
            })
                }

    function restart_layout() {
        force_layout.size([window.innerWidth * 20, window.innerHeight]);
        force_layout.start();
    }

    $(window).on('resize', function () {
        restart_layout();
    });

    $(function () {
        overlay = d3.select('body').append('div')
            .attr("pointer-events", "none")
            .attr("style", 'z-index:1;position:fixed; top:0; left:0; width:0; height:0;');

        defs = overlay.append('svg').style('width', 0).style('height', 0).append('defs');

        link = overlay.selectAll('.link');
        node = overlay.selectAll('.node');
    });

    function recommended_offset(link) {

        var siblings = [];

        for (var i=0; i<link.source.children.length; i++) {
            var sibling = link.source.children[i];
            if (sibling.fixed) {
                // d3 sets fixed to 1 in some places instead of true..
            }
            else if (sibling.source_visible) {
                siblings.push(sibling);
            }
        }

        var sibling_index = 0;
        var sibling_heights = [];
        var sibling_y = 0;
        var sibling_spacing = 0;

        for (var i=0; i<siblings.length; i++) {
            var sibling = siblings[i];
            var sibling_height = (sibling.container.outerHeight() + sibling_spacing) * sibling.scale;
            sibling_heights.push(sibling_height);
            if (sibling == link.target) {
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

        var sw = link.source.container.outerWidth() * link.source.scale;
        var sh = link.source.container.outerHeight() * link.source.scale;

        var dx = sw;
        var dy = sibling_y - total_height/2;

        return {
            dx : dx,
            dy : dy
        };
    }
})()
