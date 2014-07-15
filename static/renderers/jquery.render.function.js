$.fn.render.function = function (item, after, parent) {
    var node = new node_generator(parent);

    node.container().css({
        verticalAlign : 'top'
    });

    node.render(function () {
        return body;
    });

    var self = this;
    var fun = $('<span>');
    fun.css({
        margin : 0,
        padding : 0,
    });
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

    function params_body(source) {
        var start = source.indexOf('(') + 1;
        var end = source.indexOf(')');
        var params = source.substring(start, end)
        start = source.indexOf('{') + 1;
        end = source.length - 1;
        var body = source.substring(start, end);
        return {
            params : params,
            body   : body
        };
    }

    var pb = params_body(item.data);

    var params = $('<span>');
    params.text(pb.params);
    params.editor({
        multiline : false
    });
    params.on('return', function () {
        params.trigger('select_next', {from_direction : 'prev'});
    })
    var open = $('<span>').append([declare, begin_params, params]);

    fun.append([open, params, end_params_begin_body]);
    var body = $('<span>');
    body.text(pb.body);
    body.editor({
        multiline : true,
        highlighting : 'javascript'
    });
    var end_body = $('<span>}</span>');
    end_body.css({
        color : '#888888'
    });

    //  TODO: add node to graph for body text

    var comment = node.container();

    comment.css({
        color : 'slategrey',
        fontStyle : 'italic'
    });

    fun.append(['<br>    ', comment, '<br>', end_body, after]);
    update_comment();

    function update_comment() {
        var text = body.text();
        var comments = text.match(/^\s*\/\/([^\n]*)|^\s*\/\*((.|\n)*)\*\//m);
        var t = '';
        if (comments) {
            for (var i=1; i<comments.length; i++) {
                if (comments[i]) t = comments[i].trim();
            }
        }
        if (t == '') t = text.split('\n').length + ' lines'
        comment.text(t);
    }

    self.append(fun);

    var local_updates = {};

    var throttled_set = throttle(100, function () {
        try {
            eval('function __tmp__ (' + params.text() + ') {' + body.text() + '}');
        }
        catch (error) {
            console.log(error);
            return
        }
        if (params.text().match(/^\s*(\w+(,\s*\w+)*|)\s*$/g)) {
            var src = 'function (' + params.text() + ') {' + body.text() + '}';
            local_updates[src] = true;
            var ref = reference_source('this', [].concat(item.reference).slice(1));
            var source = ref + ' = ' + src; 
            evaluate_script([item.reference[0]], source);
        }
        else {
            console.log('ERROR saving function parameters improper form')
        }
    }, function (err, res) {
        // TODO: highlight unsaved changes and then highlight differently when saved and fade out highlight
        
    });

    body.on('change', throttled_set);
    params.on('change', throttled_set);
    body.on('change', update_comment);
    body.on('update', update_comment);

    function watch_fn(update) {
        if (update.value.type == 'function') {
            if (local_updates[update.value.data]) {
                delete local_updates[update.value.data];
            }
            else {
                var pb = params_body(update.value.data);
                params.trigger('update', pb.params);
                body.trigger('update', pb.body);
            }
        }
        else {
            self.empty();
            self.render(update.value, after);
            unwatch(item.reference, watch_fn);
        }
    }

    watch(item.reference, watch_fn);
};
