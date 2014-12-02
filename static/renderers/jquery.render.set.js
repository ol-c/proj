(function () {
    var rendered = {};

    $.fn.render.set = function (item, after, parent_source) {

        var command_line = $('<span>');
        var node = new node_generator(parent_source, hash_reference(item.reference));
        this.append(node.container());

        var self = node.container();

        var source = "if (type(this.render) == 'function' ) return this.render();\n" +
                     "else if (type(this.render) == 'reference') return resolve(this.render);\n" +
                     "else return undefined;";

        evaluate_script(item.reference, source, function (result) {
            if (result.type == 'error') {
                self.render(result);
            }
            else {
                var renderable;
                if (result.value.type == "string") {
                    renderable = result.value.data;
                }
                else if (result.value.type == 'reference') {
                    renderable = "loader...";
                }
                else {
                    renderable = $('<span>');
                    renderable.text("set");
                }
                self.append(renderable);
            }
        });

        node.render(render_generic);

        function render_generic() {
            var container = $("<div>");
           
            container.css({
                display : 'inline-block',
                verticalAlign : 'top'
            });

            container.on('select', function () {
                command_line.select();
            });

            var hashed_ref = hash_reference(item.reference);

            if (rendered[hashed_ref]) {
                var rendered_indicator = $('<div>').append("{&#8634;}");
                return container;
            }

            rendered[hashed_ref] = command_line;

            container.css({
                whiteSpace : 'pre',
                fontFamily : 'monospace',
            });

            function watch_fn(update) {
                if (update.value.type == 'set') {
                    //  render relevant changes
                }
                else {
                    //  this should never be called, as a persistant type
                    //  cannot change its own type... hmmm, or should it
                    //  be able to?!
                    self.empty();
                    self.render(update.value, after);
                    unwatch(item.reference, watch_fn);
                }
            }
            watch(item.reference, watch_fn);
            return container;
        }
    };

})();
