function then_set(reference, value_function, callback) {
    return function () {
        value_function(function (rvalue) {
            var lvalue = "this." + reference.internal;
            var statement = lvalue + ' = ' + rvalue;
            var context = {id : reference.id}
            evaluate_script(context, statement, callback);
        });
    }
}

function throttle(ms_between, fn) {
    var last_execution = null;
    function check_ready() {
        if (last_execution == null) {
            last_execution = Date.now();
        }
        var ms_since = Date.now() - last_execution;
        if (ms_since < ms_between) {
            var wait = ms_between - ms_since;
            setTimeout(check_ready, wait);
        }
        else {
            last_execution = Date.now();
            fn();
        }
    }
    return check_ready;
}
