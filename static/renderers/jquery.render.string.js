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
    content.editor();
    var edits = [];
    content.on('useredit', function (event, data) {
        local_updates[content.text()] = true;
        console.log(content.text());
        edits.push(data);
    });
    //  Ignore the first update for a state that we sent here (only want to update when there is new information)
    var local_updates = {};
    content.on('change', throttle(300, function () {
        if (edits.length) {
            var ref = reference_source('this', [].concat(reference).slice(1));

            var edit_source = '';
            while (edits.length) {
                edit_source += ref + ' = (' + edits.shift() + ')(' + ref + ');\n';
            }
            var ref = [].concat(reference);
            evaluate_script([ref.shift()], edit_source, function (res) {
                //  TODO: highlight errors...
            });
        }
    }, function (err, res) {
        // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
    }));

    $(open).hammer().on('touch', function () {
        content.trigger('movecursor', 0);
    });
    $(close).hammer().on('touch', function () {
        content.trigger('movecursor', -1);
    });

    function watch_fn(update) {
        if (update.value.type == 'string') {
            //console.log(update.value.data, local_updates)
            if (local_updates[update.value.data]) {
                //console.log('got local update')
                delete local_updates[update.value.data];
            }
            else {
                //console.log('got no local update...')
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
