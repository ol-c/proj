$.renderers = {};
$.fn.render = function (item, after) {
    $(this).css({
        'user-select' : 'none'
    });
    if ($.fn.render[item.type]) {
        return $.fn.render[item.type].apply(this, arguments);
    }
    else {
        throw new Error('requested bad renderer', item);
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
