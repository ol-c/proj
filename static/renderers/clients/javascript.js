$.fn.render.client.clients.js = {
    render : function (input) {
        function render_error (error) {
            var el = $('<div>').css({color : 'red'});
            el.text(error.toString());
            return el;
        }
        try { return eval('(function () {' + input + '})()'); }
        catch (error) { return render_error(error); }
    },
    highlighter : 'javascript'
};
