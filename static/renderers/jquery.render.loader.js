$.fn.render.loader = function (item, after, parent_node) {
    var self = this;

    var value = $('<span>loader</span>');

    var render_data;

    perform_operation({
        type : 'source reference',
        reference : item.reference
    }, function (item) {
        //  render operation returns data about the
        //  rendering, including the watch function
        //  used
        value.empty();
        render_data = value.render(item, after, parent_node);
        if (reference_changed) {
            render_data.change_reference(new_reference);
        }
        if (unrender) {
            render_data.unrender();
        }
    });

    self.append(value);

    var reference = item.reference;

    var unrender = false;
    var reference_changed = false;

    return {
        //  this function is here for containers to change
        //  the reference that the rendered version of a
        //  piece of data watches
        change_reference : function (new_reference) {
            reference = new_reference;
            if (render_data) {
                render_data.change_reference(reference);
            }
            else {
                reference_changed = true;
            }
        },
        unrender : function () {
            if (render_data) {
                //  TODO: don't unrender both!!!!
                render_data.unrender();
            }
            else {
                unrender = true;
            }
        }

    };
};
