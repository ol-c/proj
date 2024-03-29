$.fn.render.string = function (item, after) {
    var self = this;
    var reference = item.reference;

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
    content.editor({
        
    });
    var edits = [];
    content.on('useredit', function (event, data) {
        local_updates[content.text()] = true;
        edits.push(data);
    });
    //  Ignore the first update for a state that we sent here (only want to update when there is new information)
    var local_updates = {};
    content.on('change', throttle(100, function () {
        if (edits.length) {
            var ref = reference_source('this', [].concat(reference).slice(1));

            var tmp_ref = '__tmp_ref__';
            var edit_source = 'var ' + tmp_ref + ' = ' + ref + ';';

            //  this will work if all updates to a string are compiled into one update per synchronous call
            while (edits.length) {
                edit_source += tmp_ref + ' = (' + edits.shift() + ')(' + tmp_ref + ');\n';
            }
            edit_source += ref + ' = __tmp_ref__;';

            var ref = [].concat(reference);
            evaluate_script([ref.shift()], edit_source, function (res) {
                //  TODO: expose errors...
            });
        }
    }));

    $(open).hammer().on('touch', function () {
        content.trigger('movecursor', 0);
    });
    $(close).hammer().on('touch', function () {
        content.trigger('movecursor', -1);
    });

    function watch_fn(update) {
        if (update.value.type == 'string') {
            if (local_updates[update.value.data]) {
                delete local_updates[update.value.data];
            }
            else {
                content.trigger('update', update.value.data);
            }
        }
        else {
            self.empty();
            self.render(update.value, after);
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
}
