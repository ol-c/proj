(function () {
    var selectable = [];
    function sort_selectable() {
        
    }

    function auto_select_first() {
         if (selectable[0]) {
             selectable[0].trigger('select', {});
         }
         else setTimeout(auto_select_first, 100);
    }
    auto_select_first();

    function index(item) {
       for (var i=0; i<selectable.length; i++) {
           if (item[0] == selectable[i][0]) return i;
       }
       return 0; 
    }
    var current;
    $.fn.selectable = function (action) {
        var self = this;
        selectable.push(self);
        sort_selectable();
        self.on('select', function () {
            current = index(self);
        });
        self.on('select_prev', function (event, data) {
            current = index(self);
            if (current > 0) {
                current -= 1;
                $(selectable[current]).trigger('select', {
                    from_direction : 'next'
                });
            }
        });
        self.on('select_next', function (event, data) {
            current = index(self);
            if (current < selectable.length - 1) {
                current += 1;
                $(selectable[current]).trigger('select', {
                    from_direction : 'prev'
                });
            }
        });
    }
    $.fn.selected = function () {
        if (current !== undefined) {
            return selectable[current][0] == this[0];
        }
        else return false;
    }
})();
