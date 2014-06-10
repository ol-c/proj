$.fn.render.error = function (item, after) {
    var self = this;
    var message = $('<pre>');
    message.css({
        color : 'tomato'
    });
    message.append(item.data);
    self.append(message);
};
