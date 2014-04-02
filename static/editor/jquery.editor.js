(function () {
    var current_editor = null;
    var cursor = $('<span>');
    cursor.css({
        display : 'inline-block',
        height : '12px',
        borderLeft : '1ex solid orange',
        marginLeft : '0',
        marginRight : '-1ex',
        position : 'relative',
        top : '2px',
        opacity : 0.9,
        zIndex : -1
    });
    cursor.hide();
    $(function () {
        $('body').append(cursor);
        fadeOut();
    });
    function fadeOut() {
        cursor.fadeOut(100, wait(200, fadeIn));
    }
    function fadeIn() {
        var after = wait(1000, fadeOut);
        if (current_editor) cursor.fadeIn(100, after);
        else fadeOut();
    }
    function wait(duration, fun) {
        return function () { setTimeout(fun, duration); };
    }

    var editing = true;

    $.fn.editor = function (options) {
        //  swap current editor for initialization
        var prev_current = current_editor;
        current_editor = this;
        current_editor.settings = {
            multiline : true
        };

        if (options) {
            for (var setting in current_editor.settings) {
                var option = options[setting];
                if (option !== undefined) {
                    current_editor.settings[setting] = option;
                }
            }
        }

        var self = this;
        self.selectable();
        
        self.on('select', function (event, info) {
            current_editor = self;
            if      (info.from_direction == 'next') self.append(cursor);
            else if (info.from_direction == 'prev') self.prepend(cursor);
        });
        self.css({
            whiteSpace : 'pre',
            fontFamily : 'monospace'
        });
        var lines = self.text().split('\n');
        self.empty();
        if (lines.length == 1 && lines[0].length == 0) lines[0] = '';

        for (var i = 0; i < lines.length; i++) {
            for (var j = 0; j < lines[i].length; j++) {
                var c = create_char(lines[i][j])
                self.append(c);
            }
            if (i < lines.length - 1) {
                self.append(create_char('\n'));
            }
        }
        
        current_editor = prev_current;
    };

    function create_char(c) {
        var character = $('<span>');
        character.text(c);
        var this_editor = current_editor;
        character.hammer().on('tap', function (e) {
            current_editor = this_editor;
            this_editor.trigger('select', {});
            var x = e.gesture.center.pageX;
            var offset = x - character.offset().left;
            var after = offset > character.width() / 2;
            if (after) character.after(cursor);
            else       character.before(cursor);
        });
        return character;
    }

    function jump_to_previous(editor) {
        if (cursor.prev().size() > 0) {
            cursor.prev().before(cursor);
        }
        else current_editor.trigger('select_prev');
    }

    function jump_to_next(editor) {
        if (cursor.next().size() > 0) {
            cursor.next().after(cursor);
        }
        else current_editor.trigger('select_next');
    }

    function jump_up() {
        
    }

    function jump_down() {
        
    }



    //  zero width space span so can move cursor to very end
    $(window).on('keydown', function (e) {
        if (current_editor) {
            if (e.ctrlKey) {
                if (e.keyCode == '83') {
                    e.preventDefault();
                    console.log('implement save');
                }
            }
            else if (editing) {
                if (e.keyCode == 37) {
                    e.preventDefault();
                    jump_to_previous();
                }
                else if (e.keyCode == 39) {
                    e.preventDefault();
                    jump_to_next();
                }
                else if (e.keyCode == 38) {
                    e.preventDefault();
                    jump_up();
                }
                else if (e.keyCode == 40) {
                    e.preventDefault();
                    jump_down();
                }
                else if (e.keyCode == 8) {
                    e.preventDefault();
                    if (cursor.prev().size() > 0) {
                        cursor.prev().remove();
                        current_editor.trigger('change');
                    }
                }
                else if (e.keyCode == 13) {
                    e.preventDefault();
                    if (current_editor.settings.multiline) {
                        var c = create_char('\n');
                        cursor.before(c);
                        current_editor.trigger('change');
                    }
                    current_editor.trigger('return');
                }
            }
        }
    });

    $(window).on('keypress', function (e) {
        if (current_editor) {
            if (editing) {
                e.preventDefault();
                var char = String.fromCharCode(e.which);
                var c = create_char(char);
                cursor.before(c);
                current_editor.trigger('change');
            }
        }
    });
})();
