$.fn.command = function (item) {
    var self = this;
    var command = $('<span>');
    self.append(command);
    var output = $('<span>');
    self.append(output);
    command.editor({
        multiline : false,
        highlighting : 'javascript',
        placeholder : $('<span> &gt; </span> ').css('color', '#888888')
    });
    command.on('up', function () {
        history_index = Math.max(0, history_index - 1);
        if (history.length == 0) history.push(command.text());
        if (history_index == history.length - 1) {
            history.push(command.text());
        }
        command.trigger('empty');
        command.trigger('append', history[history_index])
        output.empty();
    });
    var selecting_self = false;

    self.on('select', function (e) {
        e.stopImmediatePropagation();
        if (selecting_self) return;
        selecting_self = true;
        command.trigger('select', {});
        selecting_self = false;
    })
    command.on('down', function () {
        history_index = Math.min(history.length-1, history_index + 1);
        if (history.length == 0) history.push(command.text());
        command.trigger('empty');
        command.trigger('append', history[history_index]);
        output.empty();
    });
    var history_index = 0;
    var history = [];
    command.on('return', function () {
        var cmd = command.text().trim();
        if (cmd != '') {
            history.push(cmd);
            history_index = history.length;
            execute(cmd);
        }
        command.trigger('empty');
        output.empty();
    });
    command.on('change', function () {
        output.empty();
    });
    command.on('unselect', function () {
        output.empty();
    });
    function execute(cmd) {
        var object = item.data;
        var values = item.values;
        //  assuming object type is hashmap
        evaluate_script(item.reference, cmd, function (res) {
            if (res.type == 'error') {
                var error = $('<span>').css({
                    'color' : 'tomato'
                });
                output.append(error);
                error.text(res.data);
            }
            else {
               var message = $('<span>');
               output.append(message);
               message.text(JSON.stringify(res.value, null, 4))
            }
        });
    }
}
