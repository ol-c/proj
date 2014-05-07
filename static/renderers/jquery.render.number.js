$.renderers.number = function (item, after) {
        var number = $('<span>');
        number.css({
            color : 'limegreen'
        });
        number.text(item.data);
        number.editor();
        $(this).append([number, after]);
};
