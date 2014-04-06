$.fn.command = function (item, environment) {
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
        //  assuming object type is hashmap
        try {
            var environment_string = '';

            for (var variable in environment) {
                environment_string += 'var ' + variable + ' = environment["' + variable + '"];';
            }

            //  hashmap is populated with refrerences to values as its field
            var field_references = {};
            var field;

            for (field in object) {
                field_references[field] = object[field];
            }

            eval('func = function () {' +
                environment_string +
                command +
            '}');
            func.apply(object);

            var changed = {};

            function versions_match(field) {
                return field_references[field] !== object[field];
            }

            //  tracking changed fields on object
            for (field in field_references) {
                changed[field] = versions_match(field);
            }
            for (field in object) {
                changed[field] = versions_match(field);
            }
            
            //  apply modifications to fields:
            for (field in changed) {
                if (changed[field]) {
                    var new_value = object[field];
                    var value_reference = field_references[field];
                    //  undefined expectaion means do not check for expected
                    set_operation(item, field, undefined, new_value);
                }
            }
        }
        catch (error) {
            throw error;
            console.log(error.toString());
        }
    }
}
