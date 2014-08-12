(function () {
    var rendered = {};

    $.fn.render.module = function (item, after, parent_source) {
        var reference = item.reference;
        var container = $("<div>");

        var node = new node_generator(parent_source);
        this.append(node.container());

        var self = node.container();

        renderable = $('<span>');
        console.log(item);
        renderable.text('module.' + item.data.name);
        self.append(renderable);

        node.render(render_generic);

        function render_generic() {
            var source = "if (type(this.render) == 'function' ) return this.render();\n" +
                         "else if (type(this.render) == 'reference') return resolve(this.render);\n" +
                         "else return undefined;";

            evaluate_script(item.reference, source, function (result) {
                if (result.type == 'error') {
                    container.render(result);
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
                        renderable.text('hashmap');
                    }
                    container.append(renderable);
                }
            });

            return container;
        }
    };

})();
