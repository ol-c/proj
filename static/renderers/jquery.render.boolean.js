$.fn.render.boolean = function (item, after) {
    var val = $('<span></span>');
    var t = $('<span>true</span>');
    var f = $('<span>false</span>');
    t.css('color', 'lime');
    f.css('color', 'tomato');
    this.choose([t, f]);
};
