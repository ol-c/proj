$.fn.render = function (item, after) {
    $(this).css({
        'user-select' : 'none'
    });
    if (item.type == 'hashmap') {
        var self = this;
        $(self).css({
            whiteSpace : 'pre',
            fontFamily : 'monospace'
        });

        function render_hashmap() {
            var open = $('<span>{</span>');
            var command_line = $('<span>');
            command_line.command(item, user_context(item));
            open.append(command_line)
            var content_body = $('<pre>');
            var close = $('<span>}</span>');
            var keys = Object.keys(item.data);

            function render(container, reference, end) {
                //  TODO: show loader
                perform_operation({
                    type : 'source reference',
                    reference : reference
                }, function (item) {
                    container.render(item, end);
                });
            }

            for (var i=0; i<keys.length; i++) {
                var key = keys[i];
                var field = $('<span>').text('"' + key.replace('"', '\\"') + '"');
                var divider = $('<span> : </span>');
                divider.css({
                    color : '#888888'
                });
                var value = $('<span>');
                var terminate = undefined;
                
                if (i < keys.length - 1) {
                    terminate = $('<span>,</span>');
                    terminate.css({
                        color : '#888888'
                    });
                }
                render(value, item.data[key], terminate);
                var row = $('<div>');
                row.append([field, divider, value]);
                content_body.append(row);
                $(field).add(divider).add(value).css({
                    padding : 0,
                    borderSpacing : 0,
                });
                field.css({
                    color : 'lime',
                });
                row.css({
                    paddingLeft : '4ex'
                });
            }
            rendered = $('<span>');
            $(rendered).append([open, content_body, close]);
            container.append(rendered);
        }
        var container = $('<div></div>');
        $(this).append(container);
        render_hashmap();
    }
    else if (item.type == 'list') {
    }
    else if (item.type == 'function') {
        var fun = $('<span>');
        fun.css({
            margin : 0,
            padding : 0
        })
        var declare = $('<span>function</span>');
        var begin_params = $('<span> (</span>');
        var end_params_begin_body = $('<span>) {</span>');
        declare.css({
            color : 'dodgerblue'
        });
        begin_params.css({
            color : '#888888'
        });
        end_params_begin_body.css({
            color : '#888888'
        });

        var params = $('<span>');
        var start = item.data.indexOf('(') + 1;
        var end = item.data.indexOf(')');
        params.text(item.data.substring(start, end));
        var open = $('<span>').append([declare, begin_params, params]);

        fun.append([open, params, end_params_begin_body]);
        var body = $('<span>');
        start = item.data.indexOf('{') + 1;
        end = item.data.length - 1;
        body.text(item.data.substring(start, end));
        body.editor({
            highlighting : 'javascript'
        });
        var end_body = $('<span>}</span>');
        end_body.css({
            color : '#888888'
        });
        fun.append([body, end_body, after]);
        $(this).append(fun);
    }
    else if (item.type == 'string') {
        var string = $('<span>');
        string.css({
            color : 'magenta',
            borderCollapse : 'collapse',
            borderSpacing : 0,
            padding : 0
        });
        var open = $('<span>"</span>');
        string.append(open);
        var content = $('<span>');
        var close = $('<span>"</span>');
        string.append([content, close, after]);
        content.text(item.data);
        $(this).append(string);
        content.editor();
    }
    else if (item.type == 'number') {
        var number = $('<span>');
        number.css({
            color : 'limegreen'
        });
        number.text(item.data);
        number.editor();
        $(this).append([number, after]);
    }
    else if (item.type == 'null') {
        var n = $('<span>null</span>');
        n.css({
            color : '#888888'
        });
        $(this).append([n, after]);
    }
    else if (item.type == 'boolean') {
        var val = $('<span></span>');
        var t = $('<span>true</span>');
        var f = $('<span>false</span>');
        t.css('color', 'lime');
        f.css('color', 'tomato');
        var separator = $('<span> &harr; </span>');
        function set(state) {
            if (state) {
                f.fadeOut();
                t.fadeIn();
            }
            else {
                t.fadeOut();
                f.fadeIn();
            }
            separator.fadeOut();
            editing = false;
        }
        val.append([t, separator, f]);
        separator.hide();
        if (item.data) f.hide();
        else t.hide();

        $(this).append([val, after]);
        function change(e) {
            if (second_click) second_click = false;
            else if (editing) {
                if      (e.target == t[0]) set(true);
                else if (e.target == f[0]) set(false);
            }
        }
        val.hammer().on('tap', change);
        var editing = false;
        var second_click = false;
        $(val).hammer().on('doubletap', function (e) {
            if (!editing) {
                editing = true;
                second_click = true;
                e.stopPropagation();
                f.fadeIn();
                t.fadeIn();
                separator.fadeIn();
            }
        });
    }
    else if (item.type == 'date') {
        var months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];
        var weekdays = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat"
        ];
        var weekday = $('<span>');
        var year = $('<span>');
        var month = $('<span>');
        var monthday = $('<span>');
        var hour = $('<span>');
        var minute = $('<span>');
        var second = $('<span>');
        var millisecond = $('<span>');
        var timezone = $('<span>');

        var date = new Date(item.data);

        weekday.text(weekdays[date.getDay()]);
        month.text(months[date.getMonth()])
        year.text(date.getFullYear());
        monthday.text(date.getDate());
        hour.text(date.getHours());
        minute.text(date.getMinutes());
        second.text(date.getSeconds());
        millisecond.text(date.getMilliseconds());
        var timestring = date.toTimeString();
        timezone.text(timestring.substring(timestring.indexOf('(') + 1, timestring.length - 1))

        year.editor();
        month.editor();
        monthday.editor();
        hour.editor();
        minute.editor();
        second.editor();
        millisecond.editor();

        var weekday_month_sep = $('<span>, </span>');
        var hr_mn = $('<span>:</span>');
        var mn_sc = $('<span>:</span>');
        var sc_ms = $('<span>:</span>');

        hr_mn
            .add(weekday).add(mn_sc).add(sc_ms)
            .add(weekday_month_sep)
            .css('color', '#888888');

        timezone
            .add(year).add(month)
            .add(monthday).add(hour).add(minute)
            .add(second).add(millisecond)
            .css('color', 'darkorchid');

        $(this).append([
            weekday,
            weekday_month_sep,
            month,
            ' ',
            monthday,
            ' ',
            year,
            ' ',
            hour,
            hr_mn,
            minute,
            mn_sc,
            second,
            sc_ms,
            millisecond,
            ' ',
            timezone,
            after]);
    }
    else if (item.type == 'reference') {
        var table = $('<table>');
        table.css('border-collapse', 'collapse');
        var body = $('<tbody>');
        var row = $('<tr>');
        var reference = $('<td>');
        var reference_text = $('<span>');
        reference_text.text(item.data);
        reference.append(reference_text);
        reference_text.editor();
        var value = $('<td>');
        var divider = $('<td> : <td>');
        divider.css({
            color : '#888888'
        });
        reference.css({
            color : 'dodgerblue'
        });
        table.append(body.append(row.append([reference, divider, value])))
        $([reference, divider, value]).css('border-spacing', 0);
        var placeholder_after = $('<span>');
        reference.hammer().one('doubletap', function () {
            value.render(get_reference(item.data), placeholder_after);
            placeholder_after.append(after);
            value.fadeIn();
            divider.fadeIn();
            reference.hammer().on('doubletap', function () {
                value.stop();
                divider.stop();
                if (!value.is(':visible')) placeholder_after.append(after);
                divider.toggle();
                value.toggle(function () {
                    if (value.is(':visible')) {
                        placeholder_after.append(after);
                    }
                    else {
                        reference.append(after);
                    }
                });
            });
        });
        reference.append(after);
        $(this).append(table);
        value.hide();
        divider.hide();
        reference.click()
    }
    else if (item.type == 'file') {
        var self = this;
        $.ajax({
            method : 'HEAD',
            url : item.data,
            success : function (response, textStatus, xhr) {
                var header_text = xhr.getAllResponseHeaders();
                header_pairs = header_text.split('\n');
                var headers = {};
                for (var i=0; i<header_pairs.length; i++) {
                    var header = header_pairs[i].split(':', 2);
                    if (header.length < 2) continue;
                    headers[header[0].trim()] = header[1].trim();
                }
                var a = $('<a>')
                a.css({
                    textDecoration : 'none',
                    color : 'purple'
                });
                loading.remove();
                a.text(headers['Content-Type']);
                a.attr('href', item.data);
                a.attr('target', '_blank');
                $(self).prepend(a);
            },
            error : function (error) {
                loading.remove();
                var error_placeholder = $('<span>');
                error_placeholder.text('ERROR loading file');
                error_placeholder.css({
                    color : 'red'
                });
                $(self).prepend(error_placeholder);
            }
        });
        var loading = $('<span>Loading</span>');
        loading.css({
            color : 'purple'
        });
        $(this).append([loading, after]);
    } else if (item.type) {
        console.log(item);
        var error_message = $('<span></span>');
        error_message.text('Error: ' + item.data);
        error_message.css({
            color : 'red'
        });
        $(this).append([error_message, after]);
    }
}

var root = {
    type : 'hashmap',
    data : {}
};

function get_reference(reference) {
    var references = reference.split('.');
    var value = root;
    for (var i=0; i<references.length; i++) {
        value = value.data[references[i]];
        if (value == undefined) break;
    }
    return value;
}
