(function () {
    var current_editor = null;
    var cursor = $('<span>');
    cursor.css({
        display : 'inline-block',
        height : '12px',
        borderLeft : '2px solid black',
        marginLeft : '-1px',
        marginRight : '-1px',
        position : 'relative',
        top : '2px',
    });
    cursor.hide();
    $(function () {
        $('body').append(cursor);
        fadeOut();
    });
    function fadeOut() {cursor.fadeOut(100, wait(200, fadeIn));}
    function fadeIn() {
        var after = wait(1000, fadeOut);
        if (current_editor) cursor.fadeIn(100, after);
        else fadeOut();
    }
    function wait(duration, fun) {
        return function () { setTimeout(fun, duration); };
    }
    $.fn.editor = function () {

        var self = this;
        var editing = true;
        self.css({
            whiteSpace : 'pre',
            fontFamily : 'monospace'
        });
        var lines = self.text().split('\n');
        self.empty();
        if (lines.length == 1 && lines[0].length == 0) lines[0] = '';

        function create_char(c) {
            var character = $('<span>');
            character.text(c);
            character.hammer().on('tap', function (e) {
                current_editor = self;
                var x = e.gesture.center.pageX;
                if ((x - character.offset().left) > character.width() / 2) {
                    character.after(cursor);
                }
                else character.before(cursor);
            });
            return character;
        }

        for (var i = 0; i < lines.length; i++) {
            for (var j = 0; j < lines[i].length; j++) {
                var c = create_char(lines[i][j])
                self.append(c);
            }
            if (i < lines.length - 1) {
                self.append(create_char('\n'));
            }
        }
        //  zero width space span so can move cursor to very end
        $(window).on('keydown', function (e) {
            if (current_editor == self) {
                if (e.ctrlKey) {
                    if (e.keyCode == '83') {
                        e.preventDefault();
                        console.log('implement save');
                    }
                }
                else if (editing) {
                    if (e.keyCode == 37) {
                        e.preventDefault();
                        if (cursor.prev().size() > 0) {
                            cursor.prev().before(cursor);
                        }
                    }
                    else if (e.keyCode == 39) {
                        e.preventDefault();
                        if (cursor.next().size() > 0) {
                            cursor.next().after(cursor);
                        }
                    }
                    else if (e.keyCode == 8) {
                        e.preventDefault();
                        if (cursor.prev().size() > 0) {
                            cursor.prev().remove();
                            self.trigger('change');
                        }
                    }
                    else if (e.keyCode == 13) {
                        e.preventDefault();
                        var c = create_char('\n');
                        cursor.before(c);
                        self.trigger('change');

                    }
                }
            }
        });

        $(window).on('keypress', function (e) {
            if (current_editor == self) {
                if (editing) {
                    e.preventDefault();
                    var char = String.fromCharCode(e.which);
                    var c = create_char(char);
                    cursor.before(c);
                    self.trigger('change');
                }
            }
        });
    };
})();
