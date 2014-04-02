$.fn.command = function (context) {
    var self = $(this);
    self.editor({
        multiline : false
    });
    self.on('return', function () {
        var command = self.text();
        console.log(command);
        self.text('');
    });
}
