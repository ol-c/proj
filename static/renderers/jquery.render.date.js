$.fn.render.date = function (item, after) {
    var months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    var weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    var self = this;

    var date = new Date(item.data);

    function update(date) {
        var _weekday = date.getDay();
        var _monthday = date.getDate();
        var _month = date.getMonth();
        var _year = date.getFullYear();
        var _hour = date.getHours();
        var _minute = date.getMinutes();
        var _second = date.getSeconds();
        var _millisecond = date.getMilliseconds();

        weekday.text(weekdays[_weekday]);
        month.trigger('update', _month);
        monthday.trigger('update', _monthday - 1);
        year.trigger('update', _year);
        hour.trigger('update', _hour);
        minute.trigger('update', _minute);
        second.trigger('update', _second);
        millisecond.trigger('update', _millisecond);
    }
    
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

    var year = $('<span>');
    var millisecond = $('<span>');

    month = get_text(months);
    monthday = get_chooser(range(1, 32));
    weekday = $('<span>');
    year.numberroll(4);
    
    hour = get_chooser(range(0, 23));
    minute = get_chooser(range(0, 59));
    second = get_chooser(range(0, 59));
    millisecond.numberroll(3, 3);

    var ref = {id : item.reference.id};
    var internal_ref = 'this.' + item.reference.internal;

    var local_updates = {};

    function throttled_mod(mod_function) {
        return throttle(100, function (event, value) {
            if (mod_function == 'setDate') value += 1;
            //  update local
            date[mod_function](value);
            local_updates[date.toJSON()] = true;
            weekday.text(weekdays[date.getDay()]);
            //  update remote
            //  update date and set reference so we get an update
            var script = internal_ref + '.' + mod_function + '(' + value + ');\n'
                       + internal_ref + ' = new Date(' + internal_ref + ');'; 
            evaluate_script(ref, script);
        });
    }

    update(date);

    $(year).on('change', throttled_mod('setFullYear'));
    $(month).on('change', throttled_mod('setMonth'));
    $(monthday).on('change', throttled_mod('setDate'));
    $(hour).on('change', throttled_mod('setHours'));
    $(minute).on('change', throttled_mod('setMinutes'));
    $(second).on('change', throttled_mod('setSeconds'));
    $(millisecond).on('change', throttled_mod('setMilliseconds'));

    self.append([
        weekday, ' ', month, ' ', monthday, ', ', year, ' ',
        hour, ':', minute, ':', second, ':', millisecond
    ]);

    weekday.css({
        color : '#AAAAAA'
    });


    function watch_fn(up) {
        if (up.value.type == 'date') {
            if (local_updates[up.value.data]) {
                delete local_updates[up.value.data];
            }
            else {
                date = new Date(up.value.data);
                update(date);
            }
        }
    }

    watch(item.reference, watch_fn);
};
