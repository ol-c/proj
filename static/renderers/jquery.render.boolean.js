$.fn.render.boolean = function (item, after) {
    var val = $('<span></span>');
    var t = $('<span>true</span>');
    var f = $('<span>false</span>');
    t.css('color', 'lime');
    f.css('color', 'tomato');
    var separator = $('<span> &harr; </span>');
    function set(state) {
        if (state) {
            f.fadeOut();
            t.fadeIn();
        }
        else {
            t.fadeOut();
            f.fadeIn();
        }
        separator.fadeOut();
        editing = false;
    }
    val.append([t, separator, f]);
    separator.hide();
    if (item.data) f.hide();
    else t.hide();

    $(this).append([val, after]);
    function change(e) {
        if (second_click) second_click = false;
        else if (editing) {
            if      (e.target == t[0]) set(true);
            else if (e.target == f[0]) set(false);
        }
    }
    val.hammer().on('tap', change);
    var editing = false;
    var second_click = false;
    $(val).hammer().on('doubletap', function (e) {
        if (!editing) {
            editing = true;
            second_click = true;
            e.stopPropagation();
            f.fadeIn();
            t.fadeIn();
            separator.fadeIn();
        }
    });
};
