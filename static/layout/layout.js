var layout = {};


(function () {

    var last_fixed = null;

    var svg;
    var link;
    var node;
    var defs;

    var force_layout = d3.layout.force();
    var drag = force_layout.drag();
    var node_data = force_layout.nodes();
    var link_data = force_layout.links();

    force_layout
        .friction(0.8)
        .gravity(0.0001)
        .charge(function (d) {
            //  rendered versions shouldn't push since they are constrained
            return -10000;
        })
        .linkDistance(function (d) {
            var sw = d.source.container.outerWidth();
            var sh = d.source.container.outerHeight();

            var tw = d.target.container.outerWidth();
            var th = d.target.container.outerHeight();

            return (sw + tw)/2;//Math.sqrt(sw*sw + sh*sh)/2 + tw/2;//Math.sqrt(tw*tw + th*th)/2;
        })
        .linkStrength(function (d) {
            return 2;
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


    function dragstart(d) {
        if (last_fixed) last_fixed.fixed = false;
        d3.select(this).classed('fixed', d.fixed = true);
        last_fixed = d;
    }

    drag.on("dragstart", dragstart);

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
            if (l.source.fixed) {
                
            }
            else {
                l.source.x -= r.dx/rendered_children.length/2 * k;
                l.source.y -= r.dy/rendered_children.length/2 * k;
                //  TODO: if going to move source, need to do it once for all children
                //  TODO use this technique to coax children in a fan around parent
            }
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
//            position: 'absolute',
            'z-index' : 'inherit',
            top : 0,
            left : 0,
            margin : 0,
            'background-color' :'rgba(255,255,255, .95)',
            padding : '4ch',
            'box-shadow' : "0px 0px 32px rgba(200, 200, 200, 0.95)",
            border : '1px solid rgba(220, 220, 220, 0.5)',
            'font-size' : '12px'
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
        
        var scroll_left = $(window).scrollLeft();
        var scroll_top  = $(window).scrollTop();

        link
            .attr('x1', function (d) { return d.rendered_element.offset().left - scroll_left + d.rendered_element.outerWidth()/2; })
            .attr('y1', function (d) { return d.rendered_element.offset().top - scroll_top + d.rendered_element.outerHeight()/2; })
            .attr('x2', function (d) { return Math.round(d.target.x); })
            .attr('y2', function (d) { return Math.round(d.target.y); })
            .attr('style', function (d) {
                var sw = d.rendered_element.outerWidth();
                var sh = d.rendered_element.outerHeight();
                var offset = d.rendered_element.offset();
                var sx = offset.left - scroll_left;
                var sy = offset.top  - scroll_top;

                var tw = d.target.container.outerWidth();
                var th = d.target.container.outerHeight();

                var tx = d.target.x - tw/2;
                var ty = d.target.y - th/2;

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

                return "";
            })
    }

    function initialize_links_and_nodes() {
        link = link.data(link_data);
        link.enter()
            .append('line')
            .attr('id', function (d) {
                d.id = (Math.random() + '').slice(2);
                return d.id;
            })
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
            })
            .each(function (d) {
                //  append link to the source node's g element
                $('#group-' + d.source.id).append($('#' + d.id));
            });

        node = node.data(node_data);
        node.enter()
            .append('svg:g')
            .attr('id', function (d) {
                return 'group-' + d.id;
            })
            .append('svg:foreignObject')
            .attr('pointer-events', 'all')
            //.attr('width', '100%')
            //.attr('height', '100%')
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
        svg.attr('width', window.innerWidth);
        svg.attr('height', window.innerHeight);
        force_layout.size([window.innerWidth * 20, window.innerHeight]);
        force_layout.start();
    }

    $(window).on('resize', function () {
        restart_layout();
    });

    $(function () {
        svg = d3.select('body').append('svg')
            .attr("pointer-events", "none")
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeihgt)
            .attr("style", "z-index:1;position:fixed; top:0; left:0;");

        defs = svg.append('defs');

        link = svg.selectAll('.link');
        node = svg.selectAll('.node');
    });



})()
