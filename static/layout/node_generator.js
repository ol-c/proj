var node_generator;

(function () {
    var root_source;

    node_generator = function (parent_source) {
        var container = $('<div>');
        container.css({
            verticalAlign : 'top'
        });

        var gen = this;

        var renderer;

        this.render = function (fn) {
            renderer = fn;
        };

        this.node = function () {
            return source_node;
        }

        var self = container;

        //  selectable container
        self.selectable();
        var highlighter = function () {
            self.css({
                background : 'orange'
            });
        };
        var unhighlighter = function () {
            self.css({
                background : 'none'
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
        
        var generic_view = false;
        var collapsed = true;

        var rendered = null;

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
                    layout.restart();
                }
                else if (renderer) {
                    source_node.visible = true;
                    rendered = renderer();
                    generic_view = gen.generate_node(rendered);
                    generic_view.hammer().on('touch', function (e) {
                        //  TODO: select the first selectable child for this
                        e.stopPropagation();
                    });
                    collapsed = false;
                    layout.restart();
                    //  TODO: if source node already rendered somewhere else, use that
                }
                else {
                    throw new Error('no renderer set');
                }
            }
            else if (self.selected() && e.ctrlKey && e.keyCode == 39) {
                e.preventDefault();
                if (rendered) rendered.trigger('select', {});
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



        this.container = function () {
            return container;
        };

        this.highlight = function (fn) {
            highlighter = fn;
        };

        this.unhighlight = function (fn) {
            unhighlighter = fn;
        };

        container.css({
            display : 'inline-block',
            background : 'none'
        });

        var self = container;

        var highlighter;
        var unhighlighter;

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

        //  formerly show_in_container
        this.generate_node = function (value) {
            if (root_source) {
                if (parent_source) {
                    var offset = self.offset();
                    source_node.source_visible = true;
                    source_node.x = offset.left + self.outerWidth() + 256;
                    source_node.y = offset.top + self.outerHeight() / 2
                    layout.add_node(source_node);
                    layout.add_link({source : parent_source, target : source_node, rendered_element : self});
                }
            }
            else {
                source_node.x = window.innerWidth/3;
                source_node.y = window.innerHeight/2;
                source_node.root = true;
                root_source = source_node;
                layout.add_node(source_node);
            }

            var container = $('#' + source_node.id);

            container.append(value);
            return container;
        }
    }
})();
