$.fn.render.date = function (item, after) {
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
/*
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
    */
    var self = this;

    var year = $('<span></span>');
    var month = $('<span></span>');
    var day = $('<span></span>');
    var hour = $('<span></span>');
    var minute = $('<span></span>');
    var second = $('<span></span>');
    var millisecond = $('<span></span>');

    $(this).append([
        month, ' ', day, ', ', year, ' ',
        hour, ':', minute, ':', second, ':', millisecond
    ]);
    
    function range(start, end) {
        var current = start;
        var elements = [];
        var prefix = '';
        function padding() {
            var pad = '';
            for (var i=(current + '').length; i< (end + '').length; i++) {
                pad += '0';
            }
            return pad;
        }
        while (current <= end) {
            elements.push($('<span>').text(padding() + current));
            current += 1;
        }
        return elements;
    }

    function get_chooser(options) {
        var chooser = $('<span>');
        chooser.choose(options);
        return chooser;
    }
    function get_text(text) {
        var options = [];
        for (var i=0; i<text.length; i++) {
            options.push($('<span>').text(text[i]));
        }
        return get_chooser(options);
    }

    month.append(get_text(months));
    day.append(get_chooser(range(1, 32)));
    year.numberroll(4);
    
    hour.append(get_chooser(range(0, 23)));
    minute.append(get_chooser(range(0, 59)));
    second.append(get_chooser(range(0, 59)));
    millisecond.numberroll(3, 3);
};
