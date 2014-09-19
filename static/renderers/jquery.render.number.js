$.fn.render.number = function (item, after, parent_node) {
    var self = this;
    var reference = item.reference;
    var number = $('<span>');
    number.css({
        color : 'limegreen'
    });
    number.text(item.data);
    number.editor({
        multiline : false,
        editable : false
    });
    $(this).append([number, after]);

    //  Ignore the first update for a state that we sent here (only want to update when there is new information)
    var edits = [];
    number.on('useredit', function (event, data, parent_node) {
        edits.push(data);
    });

    function is_number(test) {
        return test.match(/^((NaN)|(-|)(Infinity|\d+(\.\d*|)([eE](\+|-|)\d+|)))$/);
    }

    number.on('return', function () {
        number.trigger('select_next');
    });

    number.on('unselect', function () {
        number.trigger('update', parseFloat(number.text()) + '');
        number.css('borderBottom', 'none');
    });

    function watch_fn(update) {
        if (update.value.type == 'number') {
            if (parseFloat(number.text()) !== update.value.data) {
                var value = update.value.data;
                if (value == '-Infinity') value = -Infinity;
                else if (value == 'Infinity') value = Infinity;
                else if (value == 'NaN') value = NaN;
                number.trigger('update', value + '');
            }
        }
        else {
            self.empty();
            self.render(update.value, after, parent_node);
            unwatch(reference, watch_fn);
        }
    }
    watch(reference, watch_fn);

    return {
        change_reference : function (new_reference) {
            unwatch(reference, watch_fn);
            reference = new_reference;
            watch(reference, watch_fn);
        },
        unrender : function () {
            unwatch(reference, watch_fn);
        }

    }
};
