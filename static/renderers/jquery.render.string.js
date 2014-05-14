$.fn.render.string = function (item, after) {
    var self = this;

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
        edits.push(data);
    });
    //  Ignore the first update for a state that we sent here (only want to update when there is new information)
    var local_updates = {};
    content.on('change', throttle(100, function () {
        if (edits.length) {
            var edit_source = '';
            while (edits.length) {
                edit_source += 'this.' + item.reference.internal + ' = (' + edits.shift() + ')(this.' + item.reference.internal + ');\n';
            }
            local_updates[content.text()] = true;
            evaluate_script({id : item.reference.id}, edit_source);
        }
    }, function (err, res) {
        // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
        
    }));

    $(open ).hammer().on('touch', function () {
        content.trigger('movecursor', 0);
    });
    $(close).hammer().on('touch', function () {
        content.trigger('movecursor', -1);
    });

    function watch_fn(update) {
        if (update.value.type == 'string') {
            if (local_updates[update.value.data]) {
                console.log('purely local update!');
                delete local_updates[update.value.data];
            }
            else {
                content.trigger('update', update.value.data);
            }
        }
        else {
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);
}
