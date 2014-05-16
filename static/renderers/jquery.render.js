$.renderers = {};
$.fn.render = function (item, after) {
    $(this).css({
        'user-select' : 'none'
    });
    if ($.fn.render[item.type]) {
        $.fn.render[item.type].call(this, item, after);
    }
    else {
        var error_message = $('<span></span>');
        console.log(item, 'error...');
        error_message.text('Error: ' + item);
        error_message.css({color : 'red'});
        $(this).append([error_message, after]);
    }
}

var root = {
    type : 'hashmap',
    data : {}
};

function get_reference(reference) {
    var references = reference.split('.');
    var value = root;
    for (var i=0; i<references.length; i++) {
        value = value.data[references[i]];
        if (value == undefined) break;
    }
    return value;
}
