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
        if (current_editor) {
            cursor.show();
            cursor.css('opacity', 0.01); 
        }
        else cursor.hide();
        setTimeout(fadeIn, 300);
    }
    function fadeIn() {
        if (current_editor) {
            cursor.show();
            cursor.css('opacity', 0.9);
        }
        else cursor.hide();
        setTimeout(fadeOut, 1000);
    }

    var editing = true;

    $.fn.editor = function (options) {
        //  swap current editor for initialization
        var prev_current = current_editor;
        current_editor = this;
        current_editor.settings = {
            multiline : true,
            highlighting : 'none'
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
        self.css({
            minWidth : '1ex',
            borderBottom : '1px solid aliceblue'
        });
        self.hammer().on('touch', function () {
            self.trigger('select', {});
            self.append(cursor);
        });

        var children;

        var collapsed = false;
        self.on('collapse', function (event, data) {
            if (collapsed) {
                
            }
            else {
                collapsed = true;
                children = self.children();
                children.detach();
                self.append('&hellip;');
            }
        });
        self.on('blur', function (event, data) {
            if (self.text() == '') self.trigger('collapse');
        });

        var errors = [];
        function mark_error(error) {
            var element = self.children().eq(error.index);
            errors.push(error);
            error.element = element;
            error.element.css({
                background : 'red'
            })
        }
        function clear_errors() {
            while (errors.length > 0) {
                errors.shift().element.css({
                    background : 'none'
                });
            }
        }

        var highlighters = {
            'none' : function () {},
            'javascript' : function () {
                var options = {
                    tolerant : true,
                    comment : true,
                    tokens : true
                };
                var styles = {
                    Block      : {color : 'skyblue'},
                    Line       : {color : 'skyblue'},
                    Keyword    : {color : 'dodgerblue'},
                    Identifier : {color : '#333333'},
                    Punctuator : {color : '#888888'},
                    Numeric    : {color : 'orangered'},
                    String     : {color : 'orangered'},
                    Boolean    : {color : 'orangered'},
                    RegularExpression : {color : 'goldenrod'}
                };
                var source = self.text();
                try {
                    var ast = esprima.parse(source, options);
                }
                catch (error) {
                    mark_error(error);
                    return;
                }
                clear_errors();
                var tokens = ast.tokens;
                var comments = ast.comments.slice(0);
                var index = 0;

                var cursor_index = self.children().index(cursor);

                for (var i=0; i<=tokens.length; i++) {
                    var token = tokens[i];
                    var token_start = Infinity;
                    if (token) {
                        token_start = source.indexOf(token.value, index-1);
                    }
                    //  check if there is a comment before this
                    //  token starts. if there is, highlight the
                    //  comment and advance the index past it
                    var s_com_start = source.indexOf('/*', index);
                    var m_com_start = source.indexOf('//', index);
                    if (s_com_start == -1) s_com_start = Infinity;
                    if (m_com_start == -1)  m_com_start = Infinity;
                    var comment_start = Math.min(s_com_start, m_com_start);
                    if (comment_start < token_start) {
                        //  back up so we can process the token after the comment
                        i -= 1;
                        token = comments.shift();
                        token_start = comment_start;
                        if (token.type == 'Block') {
                            token.value = '/*'+token.value+'*/';
                        }
                        else {
                            token.value = '//'+token.value;
                        }
                    }
                    if (token) {
                        if (token_start >= cursor_index) {
                            token_start += 1;
                        }
                        var style = styles[token.type];
                        if (style === undefined) style = {};
                        index = token_start + token.value.length;
                        if (token_start < cursor_index && index >= cursor_index) {
                            index += 1;
                        }
                        self.children().slice(token_start, index).css(style);
                    }
                }
            }
        };

        self.on('change', function () {
            var highlighting = self.settings.highlighting;
            highlighters[highlighting.toLowerCase()]();
        });

        self.on('select', function (event, info) {
            if (current_editor) current_editor.trigger('blur');
            current_editor = self;
            if (collapsed) {
                collapsed = false;
                self.empty();
                self.append(children);
            }
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
        if (self.text() == '') self.trigger('blur');
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
                else if (e.keyCode == 9) {
                    e.preventDefault();
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
