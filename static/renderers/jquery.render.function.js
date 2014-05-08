$.fn.render.function = function (item, after) {
        var fun = $('<span>');
        fun.css({
            margin : 0,
            padding : 0
        })
        var declare = $('<span>function</span>');
        var begin_params = $('<span> (</span>');
        var end_params_begin_body = $('<span>) {</span>');
        declare.css({
            color : 'dodgerblue'
        });
        begin_params.css({
            color : '#888888'
        });
        end_params_begin_body.css({
            color : '#888888'
        });

        var params = $('<span>');
        var start = item.data.indexOf('(') + 1;
        var end = item.data.indexOf(')');
        params.text(item.data.substring(start, end));
        var open = $('<span>').append([declare, begin_params, params]);

        fun.append([open, params, end_params_begin_body]);
        var body = $('<span>');
        start = item.data.indexOf('{') + 1;
        end = item.data.length - 1;
        body.text(item.data.substring(start, end));
        body.editor({
            highlighting : 'javascript'
        });
        var end_body = $('<span>}</span>');
        end_body.css({
            color : '#888888'
        });
        fun.append([body, end_body, after]);
        $(this).append(fun);

        body.on('change', throttle(3000, then_set(item.reference, function (callback) {
            var fn = "function (user, params) {" + body.text() + "}";
            callback(fn);
        }, function (err, res) {
            //  TODO: highlight unsaved changes and then highlight saved changes differently and fade out highlight
        })));
};
