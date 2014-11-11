(function () {
    //  used to find last position of cursor for moving up and down
    var start_x;
    var start_y;

    var current_editor = null;
    var last_highlight = null;
    var cursor = $('<span>');
    cursor.css({
        display : 'inline-block',
        height : '1em',
        borderLeft : '1ch solid orange',
        marginLeft : '0',
        marginRight : '-1ch',
        position : 'relative',
        verticalAlign : 'text-top',
        zIndex : 9999
    });
    cursor.hide();

    var editing = true;
    var normal_bottom_border = 'none';
    var error_bottom_border  = '2px double red';

    var highlighter;
    var unhighlighter;


    var timeouts = [];
    function highlight() {
        var time_on = 1000;
        var time_off = 500;
        if (current_editor && current_editor.selected()) {
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

    $.fn.editor = function (options) {
        //  swap current editor for initialization
        var prev_current = current_editor;
        current_editor = this;
        current_editor.settings = {
            multiline : true,
            highlighting : 'none',
            placeholder : '',
            editable : true,
            block_down : false,
            block_up   : false
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

        self.hammer().on('touch', function (e) {
            e.stopImmediatePropagation();
        });

        if (self.settings.editable) self.selectable();
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
        self.on('expand', function (event, data) {
            
        });

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
                    if (self.settings.editable) {
                        self.trigger('select', {});
                    }
                });
                self.append(placeholder);
            }
        });
        self.on('blur', function (event, data) {
            if (self.text().trim() == '' && self.settings.placeholder) {
                 self.trigger('collapse');
             }
        });
        self.on('empty', function (event, data) {
            self.empty();
            if (self == current_editor) {
                self.append(cursor);
            }
            else {
                self.trigger('collapse');
            }
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
            if (typeof data !== 'string') {
                throw new Error('only strings are valid updates for an editor');
            }
            var edits = edits_between(data, self.text());
            var children = [];
            self.children().each(function (index, child)  {
                if (child != cursor[0]) {
                    children.push($(child));
                }
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
            var children = self.children();
            var l = children.size();
            if (index < 0) index = Math.max(0, l - index);
            index = Math.min(l, index);
            if (index == l) {
                self.append(cursor);
            }
            else {
                children.eq(index).before(cursor);
            }
        });

        //  used to establish where to start
        //  between up and down seeks
        self.on('select', function () {
            start_x = -Infinity;
        });

        self.on('up', function () {
            if (current_editor.settings.block_up) return;

            var current = cursor.prev();
            var current_text = current.text();

            var hidden = !cursor.is(':visible');

            if (hidden) cursor.show().text('x');
            var offset = cursor.offset();
            if (hidden) cursor.hide().text('');


            if (current.size() == 0) {
                self.trigger('select_prev');
                return;
            }

            start_x = Math.max(offset.left, start_x);
            start_y = offset.top;

            var above_line_found = false;
            var column_found = false;

            while (current.size() == 1) {
                current_text = current.text();
                if (current_text == '\n') current.text('X');
                offset = current.offset();
                if (current_text == '\n') current.text('\n');
                if (!above_line_found && offset.top < start_y) {
                    above_line_found = true;
                }
                
                if (above_line_found && offset.left <= start_x) {
                    column_found = true;
                }
                
                if (above_line_found && column_found) {
                    break;
                }

                current = current.prev();
            }

            if (current && above_line_found) {
                // move cursor to prev
                var index = self.children().index(current);
                self.trigger('movecursor', index);
            }
            else {
                self.trigger('movecursor', 0);
            }
        });

        self.on('down', function () {

            if (current_editor.settings.block_down) return;

            var current = cursor.next();
            var current_text = current.text();

            var hidden = !cursor.is(':visible');

            if (hidden) cursor.show();
            var offset = cursor.offset();
            if (hidden) cursor.hide();

            if (current.size() == 0) {
                self.trigger('select_next');
                return;
            }

            start_x = Math.max(offset.left, start_x);
            start_y = offset.top;

            var below_line_found = false;
            var column_found = false;

            while (current.size() == 1) {
                current_text = current.text();
                if (current_text == '\n') {
                    if (below_line_found) {
                        break;
                    }
                    below_line_found = true;
                    current.text('X');
                }
                offset = current.offset();
                if (current_text == '\n') {
                    current.text('\n');
                    current = current.next();
                    continue;
                }
                if (!below_line_found && offset.top > start_y) {
                    below_line_found = true;
                }
                
                if (below_line_found && offset.left >= start_x) {
                    column_found = true;
                }
                
                if (below_line_found && column_found) {
                    break;
                }

                if (current_text)
                current = current.next();
            }

            if (current && below_line_found) {
                var index = self.children().index(current);
                self.trigger('movecursor', index);
            }
            else {
                self.trigger('movecursor', Infinity);
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
            'none' : function () {
                self.children().css({
                    color : 'none'
                });
            },
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

        self.on('highlight', function (event, data) {
            highlighters[data.toLowerCase()]();
            self.settings.highlighting = data;
        });

        self.on('change', function () {
            var highlighting = self.settings.highlighting;
            highlighters[highlighting.toLowerCase()]();
        });

        self.on('select', function (event, info) {
            event.stopImmediatePropagation();
            current_editor = self;
            if (collapsed) {
                collapsed = false;
                self.empty();
                self.append(children);
            }
            if      (info.from_direction == 'next') self.append(cursor);
            else if (info.from_direction == 'prev') self.prepend(cursor);
            else if (info.from_character) {
                
            }
            else {
                self.prepend(cursor);
            }

            highlighter = function() {
                unhighlighter();
                cursor.next().css({
                    background : 'rgba(255,165,0,0.9)'
                });
                if (cursor.next().size() && cursor.next().text() !== '\n') {
                    cursor.css({opacity : 0});
                }
                else {
                    cursor.css({zIndex : 9999, opacity : 1});
                    cursor.show();
                }
                last_highlight = cursor.next();
            }

            unhighlighter = function() {
                if (last_highlight) {
                    last_highlight.css({
                        background : 'none'
                    });
                }
                cursor.css({opacity : 0});
                last_highlight = null;
            }

            highlight();
        });
        self.on('unselect', function (event, info) {
            cursor.hide();
            if (self.text().trim() == '' && self.settings.placeholder) self.trigger('collapse');
            current_editor = null;
            highlight();
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
            if (this_editor.settings.editable) {
                var x = e.gesture.center.pageX;
                var offset = x - character.offset().left;
                var after = offset > character.width() / 2;
                if (after) character.after(cursor);
                else       character.before(cursor);
                this_editor.trigger('select', {from_character : true});
            }
        });
        return character;
    }

    function jump_to_previous(editor) {
        start_x = -Infinity;
        if (cursor.prev().size() > 0) {
            cursor.prev().before(cursor);
        }
        else current_editor.trigger('select_prev');
        highlight();
    }

    function jump_to_next(editor) {
        start_x = -Infinity;
        if (cursor.next().size() > 0) {
            cursor.next().after(cursor);
        }
        else current_editor.trigger('select_next');
        highlight();
    }

    function jump_up() {
        current_editor.trigger('up');
        highlight();
    }

    function jump_down() {
        current_editor.trigger('down');
        highlight();
    }

    $(window).on('keydown', function (e) {
        if (current_editor) {
            if (e.ctrlKey) {
            }
            else if (editing) {
                if (e.keyCode == 37) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    jump_to_previous();
                }
                else if (e.keyCode == 39) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    jump_to_next();
                }
                else if (e.keyCode == 38) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    jump_up();
                }
                else if (e.keyCode == 40) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    jump_down();
                }
                else if (e.keyCode == 8) {
                    e.preventDefault();
                    if (cursor.prev().size() > 0) {
                        //  user edit encodes user intention as best as possible
                        var index_guess = index_guesser();
                        cursor.prev().remove();
                        current_editor.trigger('useredit', 'function (string) {return string.slice(0, ' + index_guess + ') + string.slice(' + index_guess + ' + 1);}');
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
                highlight();
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
            if (e.which == 13) return true;
            e.preventDefault();
            var char = String.fromCharCode(e.which);
            var c = create_char(char);
            cursor.before(c);
            if (char === '"') char = '\\"';
            else if (char === '\\') char = '\\\\';


            //  Guess cursor position
            //  slice in the character
            //  return the new string;

            var index_guess = index_guesser();
            current_editor.trigger('useredit', 'function (string) {return string.slice(0, ' + index_guess + ') + "' + char + '" + string.slice(' + index_guess + ');}');
            current_editor.trigger('change');
        }
    });
})();
