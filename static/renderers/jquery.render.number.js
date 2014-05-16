$.fn.render.number = function (item, after) {
    var self = this;
    var number = $('<span>');
    number.css({
        color : 'limegreen'
    });
    number.text(item.data);
    number.editor({
        multiline : false
    });
    $(this).append([number, after]);

    //  Ignore the first update for a state that we sent here (only want to update when there is new information)
    var edits = [];
    number.on('useredit', function (event, data) {
        edits.push(data);
    });

    function is_number(test) {
        return test.match(/^((NaN)|(-|)(Infinity|\d+(\.\d*|)([eE](\+|-|)\d+|)))$/);
    }

    var local_updates = {};
    number.on('change', throttle(100, function () {
        var str = number.text();
        if (edits.length && is_number(str)) {
            number.css('border-bottom', 'none');
            var val = parseFloat(str);
            var edit_source = 'this.' + item.reference.internal + ' = ' + val + ';';
            local_updates[number.text()] = true;
            evaluate_script({id : item.reference.id}, edit_source);
            edits = [];
        }
        else {
            number.css('borderBottom', '1px solid tomato');
        }
    }, function (err, res) {
        // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
        
    }));

    number.on('return', function () {
        number.trigger('select_next');
    });

    number.on('unselect', function () {
        number.trigger('update', parseFloat(number.text()) + '');
        number.css('borderBottom', 'none');
    });

    function watch_fn(update) {
        if (update.value.type == 'number') {
            if (local_updates[update.value.data + '']) {
                delete local_updates[update.value.data];
            }
            else if (parseFloat(number.text()) !== update.value.data) {
                var value = update.value.data;
                if (value == '-Infinity') value = -Infinity;
                else if (value == 'Infinity') value = Infinity;
                else if (value == 'NaN') value = NaN;
                number.trigger('update', value + '');
            }
        }
        else {
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);

};
