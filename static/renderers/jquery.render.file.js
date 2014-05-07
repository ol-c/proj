$.fn.render.file = function (item, after) {
    var self = this;
    $.ajax({
        method : 'HEAD',
        url : item.data,
        success : function (response, textStatus, xhr) {
            var header_text = xhr.getAllResponseHeaders();
            header_pairs = header_text.split('\n');
            var headers = {};
            for (var i=0; i<header_pairs.length; i++) {
                var header = header_pairs[i].split(':', 2);
                if (header.length < 2) continue;
                headers[header[0].trim()] = header[1].trim();
            }
            var a = $('<a>')
            a.css({
                textDecoration : 'none',
                color : 'purple'
            });
            loading.remove();
            a.text(headers['Content-Type']);
            a.attr('href', item.data);
            a.attr('target', '_blank');
            $(self).prepend(a);
        },
        error : function (error) {
            loading.remove();
            var error_placeholder = $('<span>');
            error_placeholder.text('ERROR loading file');
            error_placeholder.css({
                color : 'red'
            });
            $(self).prepend(error_placeholder);
        }
    });
    var loading = $('<span>Loading</span>');
    loading.css({
        color : 'purple'
    });
    $(this).append([loading, after]);
};
