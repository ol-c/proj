$.fn.command = function (item, environment) {
    var self = this;
    var command = $('<span>');
    self.append(command);
    var errors = $('<span>');
    errors.css({
        color : 'tomato',
    });
    self.append(errors);
    command.editor({
        multiline : false,
        highlighting : 'javascript',
        placeholder : ' > '
    });
    command.on('up', function () {
        history_index = Math.max(0, history_index - 1);
        if (history.length == 0) history.push(command.text());
        if (history_index == history.length - 1) {
            history.push(command.text());
        }
        command.trigger('empty');
        command.trigger('append', history[history_index])
    });
    command.on('down', function () {
        history_index = Math.min(history.length-1, history_index + 1);
        if (history.length == 0) history.push(command.text());
        command.trigger('empty');
        command.trigger('append', history[history_index]);
    });
    var history_index = 0;
    var history = [];
    command.on('return', function () {
        var cmd = command.text();
        history.push(cmd);
        history_index = history.length;
        execute(cmd);
        command.trigger('empty');
        errors.empty();
    });
    command.on('change', function () {
        errors.empty();
    });
    command.on('unselect', function () {
        errors.empty();
    });
    function execute(cmd) {
        var object = item.data;
        var values = item.values;
        //  assuming object type is hashmap
        evaluate_script(item.reference, cmd, function (res) {
            if (res.type == 'error') {
                var error = $('<span>');
                errors.append(error);
                error.text(res.data);
            }
            else {
               console.log(res);
            }
        });
    }
}
