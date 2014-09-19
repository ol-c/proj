$.fn.render.boolean = function (item, after) {
    var self = this;

    var reference = item.reference;

    var val = $('<span></span>');
    var t = $('<span>true</span>');
    var f = $('<span>false</span>');
    t.css('color', 'lime');
    f.css('color', 'tomato');
    this.choose([t, f]);
    
    this.on('change', throttle(100, function (data, index) {
        var state = 'false';
        if (index == 0) state = 'true';
        var path = reference_source('this', [].concat(reference).slice(1));
        evaluate_script([reference[0]], path + ' = ' + state + ';');
    }));

    if (item.data) {
        self.trigger('update', 0);
    }
    else {
        self.trigger('update', 1);
    }


    function watch_fn(update) {
        if (update.value.type == 'boolean') {
            var index = 1;
            if (update.value.data) index = 0;
            self.trigger('update', index);
        }
        else {
            self.empty();
            self.render(update.value, after);
            unwatch(reference, watch_fn);
        }
    }

    watch(reference, watch_fn);


    return {
        change_reference : function (new_reference) {
            unwatch(reference, watch_fn);
            reference = new_reference;
            watch(reference, watch_fn);
        },
        unrender : function () {
            unwatch(reference, watch_fn);
        }

    }
};
