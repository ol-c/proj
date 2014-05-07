$.fn.render.reference = function (item, after)  {
    var table = $('<table>');
    table.css('border-collapse', 'collapse');
    var body = $('<tbody>');
    var row = $('<tr>');
    var reference = $('<td>');
    var reference_text = $('<span>');
    reference_text.text(item.data);
    reference.append(reference_text);
    reference_text.editor();
    var value = $('<td>');
    var divider = $('<td> : <td>');
    divider.css({
        color : '#888888'
    });
    reference.css({
        color : 'dodgerblue'
    });
    table.append(body.append(row.append([reference, divider, value])))
    $([reference, divider, value]).css('border-spacing', 0);
    var placeholder_after = $('<span>');
    reference.hammer().one('doubletap', function () {
        value.render(get_reference(item.data), placeholder_after);
        placeholder_after.append(after);
        value.fadeIn();
        divider.fadeIn();
        reference.hammer().on('doubletap', function () {
            value.stop();
            divider.stop();
            if (!value.is(':visible')) placeholder_after.append(after);
            divider.toggle();
            value.toggle(function () {
                if (value.is(':visible')) {
                    placeholder_after.append(after);
                }
                else {
                    reference.append(after);
                }
            });
        });
    });
    reference.append(after);
    $(this).append(table);
    value.hide();
    divider.hide();
    reference.click();
};
