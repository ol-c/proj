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
    var interval = 500;
    var hide_time = 500;
    var show_time = 1000;
    var current = 0;
    setInterval(function () {
        if (current_editor) {
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

    $(function () {
        $('body').append(cursor);
    });
    var last_show = Date.now();
    function show_cursor() {
        current = 0;
        cursor.show();
    }
    function hide_cursor() {
        last_show = Date.now();
        cursor.hide();
    }

    var editing = true;
    var normal_bottom_border = 'none';
    var error_bottom_border  = '2px double red';

    $.fn.editor = function (options) {
        //  swap current editor for initialization
        var prev_current = current_editor;
        current_editor = this;
        current_editor.settings = {
            multiline : true,
            highlighting : 'none',
            placeholder : ''
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
            borderBottom : normal_bottom_border,
        });
        
        var children;
        var before_cursor = '';
        function update_before_cursor() {
            before_cursor = '';
            var prev = cursor;
            for (var i=0; i<3; i++) {
                prev = prev.prev();
                if (prev.size()) {
                    before_cursor = prev.text() + before_cursor;
                }
                else break;
            }
        }

        var collapsed = false;
        self.on('collapse', function (event, data) {
            if (collapsed) {
                
            }
            else {
                collapsed = true;
                children = self.children();
                children.detach();
                var placeholder = $('<span></span>');
                if (self.settings.placeholder) {
                    placeholder.append(self.settings.placeholder);
                }
                placeholder.hammer().on('touch', function (event) {
                    self.trigger('select', {});
                });
                self.append(placeholder);
            }
        });
        self.on('blur', function (event, data) {
            if (self.text().trim() == '' && self.settings.placeholder) self.trigger('collapse');
        });
        self.on('empty', function (event, data) {
            self.empty();
            if (self == current_editor) self.append(cursor);
            else self.trigger('collapse');
        });
        self.on('append', function (event, data) {
            for (var i=0; i<data.length; i++) {
                var char = create_char(data[i]);
                self.append(char);
            }
        });
        self.on('useredit', function () {
            update_before_cursor();
        });
        self.on('update', function (event, data) {
            var edits = edits_between(data, self.text());
            var children = [];
            self.children().each(function (index, child)  {
                if (child != cursor[0]) children.push($(child));
            });
            apply_edits(edits, data.split(''),
                function sub(index, item) {
                    children[index].text(item);
                },
                function del(index) {
                    children[index].remove();
                    children.splice(index, 1);
                },
                function ins(index, item) {
                    var c = create_char(item);
                    if (index == 0) {
                        self.prepend(c);
                    }
                    else if (index > children.length) {
                        self.append(c);
                    }
                    else {
                        children[index-1].after(c);
                    }
                    children.splice(index, 0, c);
                });
            //  place the cursor in the proper location
            //        strategy : find closest expected "before_cursor" substring
            //                   if it is close enough to where the cursor actually is, place the cursor

            //  this arises when doing lots of deletions from another terminal (deletion must be failing)
            if (data !== self.text()) console.log('ERROR!!!!!!!!!!!');

            var cursor_index = cursor.index();

            var matches = [];
            var look = 0;
            var next_match = data.indexOf(before_cursor);
            var max_distance = 10;
            while (next_match != -1 && next_match < data.length) {
                matches.push(next_match + before_cursor.length);
                next_match = data.indexOf(before_cursor, next_match + 1);
            }
            var best_match = cursor_index;
            var best_match_distance = Infinity
            for (var i=1; i<matches.length; i++) {
                var match_distance = Math.abs(cursor_index - matches[i]);
                if (match_distance < best_match_distance && match_distance < max_distance) {
                    best_match = matches[i];
                    best_match_distance = match_distance;
                }
            }
        });
        self.on('movecursor', function (event, index) {
            if (!self.selected()) self.trigger('select', {});
            hide_cursor();
            var children = self.children();
            var l = children.size();
            if (index < 0) index = Math.max(0, l - index);
            index = Math.min(l, index);
            show_cursor();
            if (index == l) {
                self.append(cursor);
            }
            else {
                children.eq(index).before(cursor);
            }
        });


        var errors = [];
        function mark_error(error) {
            var element = self.children().eq(error.index);
            if (element[0] == cursor[0]) element = cursor.next();
            else if (error.index > self.children().index(cursor)) {
                element = element.next();
            }
            errors.push(error);
            error.element = element;
            error.element.css({
                borderBottom : error_bottom_border
            })
        }
        function clear_errors() {
            while (errors.length > 0) {
                errors.shift().element.css({
                    borderBottom : normal_bottom_border
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
                    String     : {color : 'magenta'},
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
                if (cursor_index == -1) cursor_index = Infinity;

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
            show_cursor();
            current_editor = self;
            if (collapsed) {
                collapsed = false;
                self.empty();
                self.append(children);
            }
            if      (info.from_direction == 'next') self.append(cursor);
            else if (info.from_direction == 'prev') self.prepend(cursor);
            else self.append(cursor);
        });
        self.on('unselect', function (event, info) {
            cursor.hide();
            if (self.text().trim() == '' && self.settings.placeholder) self.trigger('collapse');
            current_editor = null;
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
        else self.trigger('change', {})
    };

    function create_char(c) {
        var character = $('<span>');
        character.text(c);
        var this_editor = current_editor;
        character.hammer().on('touch', function (e) {
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
        current_editor.trigger('up');
    }

    function jump_down() {
        current_editor.trigger('down');
    }

    $(window).on('keydown', function (e) {
        if (current_editor) {
            if (e.ctrlKey) {
            }
            else if (editing) {
                show_cursor();
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
                        //  user edit encodes user intention as best as possible
                        var index_guess = index_guesser();
                        current_editor.trigger('useredit', 'function (string) {return string.slice(0, ' + index_guess + ') + string.slice(' + index_guess + ' + 1);}');
                        cursor.prev().remove();
                        current_editor.trigger('change');
                    }
                }
                else if (e.keyCode == 13) {
                    e.preventDefault();
                    if (current_editor.settings.multiline) {
                        var c = create_char('\n');
                        cursor.before(c);
                        var index_guess = index_guesser();
                        current_editor.trigger('useredit', 'function (string) {return string.slice(0, ' + index_guess + ') + "\\n" + string.slice(' + index_guess + ');}');
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

    /*
        data sent on a useredit event is a function that takes a 
        reference to the existing value, does its best to guess the
        intended edit (easily perfect guess if not collaboratively
        editing over a network) and returns the edited object
        (necessery if the object is immutible, as in this case).
    */


    function index_guesser() {
        return "(function () {return " + Math.max(cursor.index()-1, 0) + "})()";
    }

    $(window).on('keypress', function (e) {
        if (editing && current_editor && current_editor.selected()) {
            e.preventDefault();
            var char = String.fromCharCode(e.which);
            var c = create_char(char);
            cursor.before(c);
            show_cursor();


            //  Guess cursor position
            //  slice in the character
            //  return the new string;

            var index_guess = index_guesser();
            current_editor.trigger('useredit', 'function (string) {return string.slice(0, ' + index_guess + ') + "' + char + '" + string.slice(' + index_guess + ');}');
            current_editor.trigger('change');
        }
    });
})();
