(function () {
    var selectable = [];
    function sort_selectable() {
        
    }

    function auto_select_first() {
         if (selectable[0]) {
             selectable[0].trigger('select', {});
         }
         else setTimeout(auto_select_first, 10);
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
            var cur = index(self);
            if (cur > 0) {
                cur -= 1;
                self.trigger("unselect");
                $(selectable[cur]).trigger('select', {
                    from_direction : 'next'
                });
                current = cur;
            }
        });
        self.on('select_next', function (event, data) {
            var cur = index(self);
            if (cur < selectable.length - 1) {
                cur += 1;
                self.trigger("unselect");
                $(selectable[cur]).trigger('select', {
                    from_direction : 'prev'
                });
                current = cur;
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
