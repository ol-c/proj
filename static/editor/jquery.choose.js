$.fn.choose = function (options) {
    var self = this;

    var option_index = 0;
    self.append(options[option_index]);

    function show_options() {
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
            if (i != option_index) {
                $('body').append(options[i]);
                options[i].show();
            }
            else {
                options[i].css({
                    background : 'none',
                })
            }
            if (i < option_index) {
                current_height -= options[i].outerHeight();
            }
        }
        for (var i=0; i<options.length; i++) {
            if (i != option_index) {
                options[i].css({
                    position : "absolute",
                    top : offset.top + current_height,
                    left : offset.left,
                    background : 'aliceblue'
                });
            }
            current_height += options[i].outerHeight();
        }
    }

    function hide_options() {
        for (var i=0; i<options.length; i++) {
            if (i != option_index) {
                options[i].hide();
            }
        }
    }

    function choose(option) {
        
    }


    self.selectable();

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

    function on_keydown(e) {
        if (e.keyCode == 37) {
            self.trigger('select_prev');
        }
        else if (e.keyCode == 39) {
            self.trigger('select_next');
        }
        else if (e.keyCode == 38 && option_index > 0) {
            e.preventDefault();
            self.empty();
            option_index -= 1;
            show_options();
        }
        else if (e.keyCode == 40 && option_index < options.length - 1) {
            e.preventDefault();
            self.empty();
            option_index += 1;
            show_options();
        }
        else if (e.keyCode == 13) {
            self.trigger('select_next');
        }
    }
}
