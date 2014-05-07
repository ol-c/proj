$.fn.render.null = function (item, after) {
        var n = $('<span>null</span>');
        n.css({
            color : '#888888'
        });
        $(this).append([n, after]);
};
