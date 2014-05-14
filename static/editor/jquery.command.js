$.fn.command = function (item, environment) {
    var self = $(this);
    self.editor({
        multiline : false,
        highlighting : 'javascript',
        placeholder : ' > '
    });
    self.on('up', function () {
        history_index = Math.max(0, history_index - 1);
        if (history.length == 0) history.push(self.text());
        if (history_index == history.length - 1) {
            history.push(self.text());
        }
        self.trigger('empty');
        self.trigger('append', history[history_index])
    });
    self.on('down', function () {
        history_index = Math.min(history.length-1, history_index + 1);
        if (history.length == 0) history.push(self.text());
        self.trigger('empty');
        self.trigger('append', history[history_index]);
    });
    var history_index = 0;
    var history = [];
    self.on('return', function () {
        var command = self.text();
        history.push(command);
        history_index = history.length;
        execute(command);
        self.trigger('empty');
    });
    function execute(command) {
        var object = item.data;
        var values = item.values;
        //  assuming object type is hashmap
        evaluate_script(item.reference, command);
    }
}
