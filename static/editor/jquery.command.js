$.fn.command = function (context) {
    var self = $(this);
    self.editor({
        multiline : false
    });
    self.on('return', function () {
        var command = self.text();
        self.trigger('empty');
        execute(command);
    });
    function execute(command) {
        var func;
        try {
            eval('func = function () {' + command + '}');
            func.apply(context);
        }
        catch (error) {
            console.log(error);
        }
    }
}
