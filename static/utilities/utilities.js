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
    var timeouts = [];
    function check_ready() {
        if (last_execution == null) {
            last_execution = Date.now();
        }
        var ms_since = Date.now() - last_execution;
        if (ms_since < ms_between) {
            var wait = ms_between - ms_since;
            timeouts.push(setTimeout(check_ready, wait));
        }
        else {
            last_execution = Date.now();
            fn();
            while (timeouts.length) {
                clearTimeout(timeouts.shift());
            }
        }
    }
    return check_ready;
}
