(function () {
    var selected;
    function auto_select_first() {
        var selectable = $('.selectable:visible');
        if (selectable.size()) {
            selectable.first().trigger('select', {});
        }
        else setTimeout(auto_select_first, 10);
    }
    $(function () {auto_select_first();});
    function index(item) {
       return $('.selectable').index(item); 
    }
    var current;
    $.fn.selectable = function (action) {
        var self = this;
        self.addClass('selectable');
        self.on('select', function (event) {
            event.stopPropagation();
            var old = selected;
            selected = this;
            if (old !== undefined) $(old).trigger('unselect');
        });
        self.on('select_prev', function (event, data) {
            event.stopPropagation();
            var selectable = $('.selectable:visible');
            var index = selectable.index(this);
            if (index > 0) selectable.eq(index - 1).trigger('select', {
                from_direction : 'next'
            });
        });
        self.on('select_next', function (event, data) {
            console.log('selecting next!')
            event.stopPropagation();
            var selectable = $('.selectable:visible');
            var index = selectable.index(this);
            if (index < selectable.size() - 1) selectable.eq(index+1).trigger('select', {
                from_direction : 'prev'
            });
        });
    }
    $.fn.selected = function () {
        return selected == this[0];
    }
})();
