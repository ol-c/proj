$.fn.choose = function (options) {
    var self = this;

    var option_index = 0;
    self.append(options[option_index]);
    var interval = 500;
    var hide_time = 500;
    var show_time = 1000;
    var current = 0;
    setInterval(function () {
        if (self.selected()) {
            current += interval;
            if (current == 0) {
                show_cursor();
            }
            else if (current == show_time) {
                hide_cursor();
            }
            else if (current == show_time + hide_time) {
                show_cursor();
            }
        }
    }, interval);
    function show_cursor() {
        current = 0;
        self.css({
            background : 'orange'
        });
    }
    function hide_cursor() {
        last_show = Date.now();
        self.css({
            background : 'none'
        });
    }

    var options_visible = false;
    function show_options() {
        options_visible = true;
        var offset = self.offset();
        self.append(options[option_index]);
        options[option_index].show();
        options[option_index].css({
            position : 'relative',
            display : 'inline',
            top : 0,
            left : 0
        });
        var current_height = 0;
        for (var i=0; i<options.length; i++) {
            var opacity = 1 / Math.pow(Math.abs(option_index - i), 2)
            if (opacity < 0.2) {
                options[i].hide();
                continue;
            }
            
            if (i != option_index) {
                $('body').append(options[i]);
                options[i].css({
                    padding : '0.5em 0',
                    opacity : opacity
                });
                options[i].show();
            }
            else {
                options[i].css({
                    padding : 0,
                    background : 'none',
                    opacity : 1
                })
            }
            if (i < option_index) {
                current_height -= options[i].outerHeight();
            }
        }
        for (var i=0; i<options.length; i++) {
            var opacity = 1 / Math.pow(Math.abs(option_index - i), 2)
            if (opacity < 0.2) continue;
            if (i != option_index) {
                options[i].css({
                    position : "absolute",
                    top : offset.top + current_height,
                    left : offset.left,
                    background : 'white', //'aliceblue'
                });
            }
            current_height += options[i].outerHeight();
        }
    }

    function hide_options() {
        options_visible = false;
        for (var i=0; i<options.length; i++) {
            if (i != option_index) {
                options[i].hide();
            }
        }
    }

    function choose(index) {
        if (option_index != index) {
            options[option_index].detach();
            option_index = index;
            self.append(options[index]);
            show_options();
            if (!self.selected()) {
                hide_options();
            }
            self.trigger('change', index);
        }
    }


    self.selectable();

    self.hammer().on('touch', function () {
        self.trigger('select');
    })

    self.on('select', function (info) {
        show_options();
        self.css({
            'background' : 'orange'
        });
        $(window).on('keydown', on_keydown);
    });

    self.on('unselect', function () {
        hide_options();
        self.css({
            background : 'none'
        });
        $(window).off('keydown', on_keydown);
    });

    self.on('update', function (data, option) {
        choose(option);
    });

    function on_keydown(e) {
        if (e.keyCode == 37) {
            self.trigger('select_prev');
        }
        else if (e.keyCode == 39) {
            self.trigger('select_next');
        }
        else if (e.keyCode == 38 && option_index > 0) {
            e.preventDefault();
            choose(option_index - 1);
        }
        else if (e.keyCode == 40 && option_index < options.length - 1) {
            e.preventDefault();
            choose(option_index + 1);
        }
        else if (e.keyCode == 13) {
            if (options_visible) {
                hide_options();
            }
            else {
                self.trigger('select_next');
            }
        }
    }
}
