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
};
