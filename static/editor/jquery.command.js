$.fn.command = function (object, environment) {
    var self = $(this);
    self.editor({
        multiline : false
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
    })
    var history_index = 0;
    var history = [];
    self.on('return', function () {
        var command = self.text();
        history.push(command);
        history_index = history.length;
        self.trigger('empty');
        execute(command);
    });
    function execute(command) {
        var func;
        try {
            var environment_string = '';

            for (var variable in environment) {
                environment_string += 'var ' + variable + ' = environment["' + variable + '"];'
            }

            var this_before = {}
            var field;
            for (field in object) {
                this_before[field] = object[field];
            }

            eval('func = function () {' +
                environment_string +
                command +
            '}');
            func.apply(object);

            var changed = {};

            function versions_match(field) {
                return this_before[field] !== object[field];
            }

            //  tracking changed fields on object
            for (field in this_before) {
                changed[field] = versions_match(field);
            }
            for (field in object) {
                changed[field] = versions_match(field);
            }
            console.log(changed);
        }
        catch (error) {
            throw error
            console.log(error);
        }
    }
}
