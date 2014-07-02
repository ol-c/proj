$.fn.behave = function (behaviors) {
    var behave = {
        fit : function (element, options) {
            function fit() {
                
                var parent = $(element).parent();
                var width = parent.width();
                var height = parent.height(); 

                var w = $(element).width();
                var h = $(element).height();
                var x = 0;
                var y = 0;

                if (w > 0 && h > 0) {
                    var aspect_ratio = w/h;
    
                    if (aspect_ratio > width / height) {
                        w = width;
                        h = width / aspect_ratio;
                        if (options.align == 'center') {
                            y = (height - h) / 2;
                        }
                    }
                    else {
                        h = height;
                        w = height * aspect_ratio;
                        if (options.align == 'center') {
                            x = (width - w) / 2; 
                        }
                    }

                    var parent_position = parent.css('position');
                    if (parent_position == 'static') {
                        parent.css('position', 'relative');
                    }
                    if (w > 0 && h > 0) {
                        $(element).css({
                            position : 'absolute',
                            width : w,
                            height : h,
                            left : x,
                            top : y
                        });
                    }
                }
            }
            //    if is image, show loading image until
            //    actual image loads
            if ($(element).is('img')) {
                var src = $(element).attr('src');
                var loader = $('<img>');
                loader.load(function () {
                    loader.css({
                        position : 'absolute',
                        left : (parent.width() - this.width)/2,
                        top : (parent.height() - this.height)/2
                    });
                });
                var original = element;
                element = loader;
                var parent = $(original).parent();
                $(original).css({'opacity' : 0});
                $(original).load(function () {
                    $(this).css({
                        opacity : 1,
                        width : this.width,
                        height : this.height
                    });
                    parent.append(original);
                    element = original;
                    loader.remove();
                    fit();
                    parentChange(element, fit);
                });
                $(original).attr('src', src);
                loader.attr('src', '/src/loading.gif');
                parent.append(loader);
            }
            else {
                fit();
                parentChange(element, fit);
            }
        },
        fill : function (element, options) {
            
            function vertical_height() {
                var parent = $(element).parent();
                parent_height = parent.innerHeight();
                prev_height = 0;
                next_height = 0;
                var parent_top = parent.first().offset().top;
                prev_height = $(element).offset().top - parent_top;
                var test = $('<div>');
                $(element).parent().append(test);
                next_height = test.position().top - ($(element).position().top + $(element).height());
                test.remove();
                return parent_height - prev_height - next_height;
            }

            function fill() {

                if (element == document.body) {
                    $(window).one('resize', fill);
                }
                var parent = $(element).parent();

                var width = parent.width();
                var height = parent.height();

                if (options.vertical_fit) {
                    height = vertical_height();
                }

                if (element == document.body) {
                    width = $(window).width();
                    height = $(window).height();
                }

                if (width > 0 && $(element).outerWidth() != width) {
                    $(element).outerWidth(width);
                }
                if (height > 0 && $(element).outerHeight() != height) {
                    $(element).outerHeight(height);
                }
            }
            parentChange(element, fill);
            fill();
        },
        fitText : function (element, options) {

            var text = $(element).contents();

            var sizer;

            function fit() {

                if (text.text() == '') return;
                if (!$.contains(document, element)) return;
                text.detach();
                var text_element = $('<div>');
                text_element.css({
                    position : 'relative',
                    display : 'inline-block'
                });
                
                if (sizer) sizer.remove();
                text_element.append(text);
                sizer = $('<div class="sizer">');
                sizer.append(text_element);
                sizer.css({
                    fontSize : 12
                });
                $(element).append(sizer);
                var text_aspect_ratio = $(text_element).width() / $(text_element).height();
                var aspect_ratio = $(element).width() / $(element).height();
                if (text_aspect_ratio > aspect_ratio) {
                    $(sizer).width($(text_element).width());
                    $(sizer).height($(text_element).width() / aspect_ratio);
                }
                else {
                    $(sizer).height($(text_element).height());
                    $(sizer).width($(text_element).height() * aspect_ratio);
                }
                while (true) {
                    var w = sizer.width();
                    var h = sizer.height();
                    sizer.width(w * 0.9);
                    sizer.height(h * 0.9);
                    if (sizer.width() < text_element.width() || sizer.height() < text_element.height()) {
                        sizer.width(w);
                        sizer.height(h);
                        break;
                    }
                }
                //    the sizer is now closest aspect ratio as its parent's
                var scale = $(element).width() / sizer.width();
                text_aspect_ratio = text_element.width() / text_element.height();
                sizer.css({
                    'webkitTransformOrigin': '0% 0%',
                    'mozTransformOrigin': '0% 0%',
                    'msTransformOrigin': '0% 0%',
                    'oTransformOrigin': '0% 0%',
                    'transformOrigin': '0% 0%',
                    'transform' : 'scale(' + scale + ', ' + scale + ')'
                });

                var top = (sizer.height() - text_element.height())/2;
                var left = (sizer.width() - text_element.width())/2;

                if (options.alignment == 'top') top = 0;

                $(element).width($(element).width());
                $(element).height($(element).height());
                text_element.css({
                    position: 'absolute',
                    top : top,
                    left : left
                })
            }
            fit();
            parentChange(element, fit);
        },
        draggable : function(element, options) {
            var offset = [0, 0];
            var scale = 1;
            var rotation = 0;
            var last_drag;
            var scroll_lock;
            $(element).on('touchstart, mousedown', function (e) {
                e.preventDefault();
            });
            
            $(element).hammer().on('drag', function (e) {
                e.stopPropagation()
                if (last_drag == undefined) {
                    last_drag = [e.gesture.deltaX, e.gesture.deltaY];
                }
                if (scroll_lock != 'vertical') {
                    offset[0] += e.gesture.deltaX - last_drag[0];
                }
                
                if (scroll_lock != 'horizontal') {
                    offset[1] += e.gesture.deltaY - last_drag[1];
                }

                last_drag = [e.gesture.deltaX, e.gesture.deltaY];

                render(element, offset, scale, rotation);
                if (options.ondrag) options.ondrag();
            });

            $(element).hammer().on('release', function () {
                last_drag = [0, 0];
                if (options.onrelease) options.onrelease();
            });

        },
        zoomable : function (element, options) {
            
            var scale = 1;
            var rotation = 0;
            var offset = [0, 0];
            var dragging = false;
            var pinching = false;
            var last_drag;
            var last_pinch;
            var last_scale = 1;

            $(element).css({
                'webkitTransformOrigin': '0% 0%',
                'mozTransformOrigin': '0% 0%',
                'msTransformOrigin': '0% 0%',
                'oTransformOrigin': '0% 0%',
                'transformOrigin': '0% 0%'
            });

            $(element).hammer().on('drag', function (e) {
                if (scale > 1) {
                    if (last_drag == undefined) {
                        last_drag = [e.gesture.deltaX, e.gesture.deltaY];
                    }
                    if (scroll_lock != 'vertical') {
                        offset[0] += e.gesture.deltaX - last_drag[0];
                    }
                    
                    if (scroll_lock != 'horizontal') {
                        offset[1] += e.gesture.deltaY - last_drag[1];
                    }

                    last_drag = [e.gesture.deltaX, e.gesture.deltaY];

                    clamp();

                    render(element, offset, 1, 0);
                }
            });


            $(element).hammer().on('drag swipeup swipedown release', function (e) {
                if (captured) {
                    e.stopPropagation();
                }
            });

            $(element).hammer().on('pinch', function (e) {
                scroll_lock = null;
                if (last_pinch == undefined) {
                    last_pinch = [e.gesture.deltaX, e.gesture.deltaY];
                }

                scale = scale / last_scale * e.gesture.scale;
                var growth = 1 - e.gesture.scale/last_scale;

                rotation = (rotation + e.gesture.rotation) % 360; 

                var o = $(element).offset();
                var x = (e.gesture.center.pageX - o.left);
                var y = (e.gesture.center.pageY - o.top);

                x *= growth;
                y *= growth;

                last_scale = e.gesture.scale;

                var deltaX = e.gesture.deltaX - last_pinch[0] + x;
                var deltaY = e.gesture.deltaY - last_pinch[1] + y

                offset[0] += deltaX;
                offset[1] += deltaY;

                last_pinch = [e.gesture.deltaX, e.gesture.deltaY];

                clamp();
                render(element, offset, scale, rotation);
            });

            $(element).on('touchend touchcancel mouseup', function (e) {
                last_pinch = undefined;
                last_drag = undefined;
                last_scale = 1;
            });

            $(element).hammer().on('doubletap', function () {
                scroll_lock = null;
                if (scale == 1) {
                    var width = $(element).width();
                    var height = $(element).height();
                    var parent_width = $(element).parent().width();
                    var parent_height = $(element).parent().height();
                    var aspect_ratio = width/height;
                    var container_ratio = parent_width / parent_height;
                    if (aspect_ratio < container_ratio) {
                        scale = parent_width / width;
                        scroll_lock = 'vertical';
                    }
                    else {
                        scale = parent_height / height;
                        scroll_lock = 'horizontal';
                    }
                    var position = $(element).position()
                    offset[0] = -position.left;
                    offset[1] = -position.top;
                }
                else {
                    offset[0] = 0;
                    offset[1] = 0;
                    scale = 1;
                }
                render();
            });

            $(element).hammer().on('release', function () {
                if (scale < 1) {
                    scale = 1;
                    offset[0] = 0;
                    offset[1] = 0;
                    render();
                }
            });

            var captured = false;

            $(element).on('touchstart touchmove', function (e) {
                if (e.originalEvent.touches.length > 1 || scale > 1) {
                    e.originalEvent.preventDefault();
                }
                if (scale > 1.1) captured = true;
                else             captured = false;
            });

            function clamp() {
                var w = $(element).width();
                var h = $(element).height();
                offset[0] = Math.max(-w * (scale-1), Math.min(0, offset[0]));
                offset[1] = Math.max(-h * (scale-1), Math.min(0, offset[1]));

                if (scale < 1) {
                    offset[0] = w * (1 - scale) / 2;
                    offset[1] = h * (1 - scale) / 2;
                }
            }

            var scroll_lock = null;
        }
    }


    function render(element, offset, scale, rotation) {
        var x = offset[0] / scale;
        var y = offset[1] / scale;
        
        var transform3d =    'scale3d(' + scale + ', '  + scale + ',1) ' + 'translate3d(' + x + 'px,' + y + 'px,0px) rotate3d(0,0,0,' + rotation + 'deg)';
        var transform2d =    'scale(' + scale + ', '     + scale + ') ' + 'translate(' + x + 'px,' + y + 'px) rotate(' + rotation + 'deg`)';

        $(element).css({
            'webkitTransform':    transform3d,
            'oTransform':        transform2d,
            'msTransform':        transform2d,
            'mozTransform':        transform2d,
            'transform':        transform3d
        });
    }


    function parentChange(element, fn) {
        var parent = $(element).parent();
        
        //    listen to window change if element is body
        var width = parent.width();
        var height = parent.height();
 
        function trigger() {
            if (parent[0]) {
                width = parent.width();
                height = parent.height();
                fn();
            }
        }

        var interval_id;
        
        interval_id = setInterval(function () {
            var element_still_exists = $.contains(document, $(element)[0]);
            
            if (!element_still_exists) {
                clearInterval(interval_id);
                return false;
            }
            
            var new_parent = $(element).parent();
            if (parent[0] != new_parent[0] || (new_parent[0] == undefined && parent[0] == undefined)) {
                parent = new_parent;
                trigger();
            }
            else if (parent.width() != width)    trigger();
            else if (parent.height() != height) trigger();
        }, 10);
    }

    this.each(function (index, element) {
        for (var behavior in behaviors) {
            if (behave[behavior]) {
                behave[behavior](element, behaviors[behavior]);
            }
        }
    });
}
