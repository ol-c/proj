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

function edits_between(a, b) {
    /************************\
    |  generate edit matrix  |
    \************************/
//    if(a.length === 0) return b.length; 
//    if(b.length === 0) return a.length; 
 
    var matrix = [];
 
    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++){
        matrix[i] = [i];
    }
 
    // increment each column in the first row
    var j;
    for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }
 
    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1,    // substitution
                                    Math.min(matrix[i][j-1] + 1, // insertion
                                        matrix[i-1][j] + 1));    // deletion
            }
        }
    }

    /******************\
    |  generate edits  |
    \******************/
 
    var i = b.length;
    var j = a.length;
    var operations = [];
    var actual_edits = 0;
    var path = '';
    while (i > 0 || j > 0) {

        path += i + ',' + j + ' ';
        if (matrix[i-1] !== undefined
        &&  matrix[i-1][j-1] !== undefined
        &&  matrix[i][j] == matrix[i-1][j-1]
        &&  matrix[i][j] <= matrix[i-1][j]
        &&  matrix[i][j] <= matrix[i][j-1]
        ) {
            i -= 1;
            j -= 1;
            operations.push('skip');
        }
        else {
            actual_edits += 1;
            var substitution = Infinity;
            var deletion = Infinity;
            var insertion = Infinity;
            if (matrix[i-1]) {
                if (matrix[i-1][j-1] !== undefined) substitution = matrix[i-1][j-1];
                if (matrix[i-1][j]   !== undefined) deletion = matrix[i-1][j];
            }
            if (matrix[i][j-1] !== undefined) {
                insertion = matrix[i][j-1];
            }
            path += '(' + substitution + ',' + insertion + ',' + deletion + ')'
            if (substitution <= insertion && substitution <= deletion) {
                operations.push('substitution');
                i -= 1;
                j -= 1;
            }
            else if (deletion <= substitution && deletion <= insertion) {
                operations.push('deletion');
                i -= 1;
            }
            else {
                operations.push('insertion');
                j -= 1;
            }
        }
        path += '    '
    }
//    console.log(path)

    var edits = [];

    for (var i=0; i<matrix.length; i++) {
        var row = '';
        for (var j=0; j<matrix[i].length; j ++) {
            row += matrix[i][j] + ' ';
        }
//        console.log(row)
    }
//    console.log(operations)

    console.log(actual_edits, matrix[matrix.length-1][matrix[0].length-1])

    var i = 0;
    var j = 0;
    var offset = 0;

//  console.log(operations)

    while (operations.length) {
        var op = operations.pop();

        if (op == 'skip') {
            i += 1;
            j += 1;
        }
        else {
            var edit = {
                type : op,
                index : j
            };
            if (op == 'substitution') {
                edit.character = a.charAt(j);
                i += 1;
                j += 1;
            }
            else if (op == 'deletion') {
                i += 1;
            }
            else if (op == 'insertion') {
                edit.character = a.charAt(j);
                j += 1;
            }
//            console.log(edit);
            edits.push(edit);
        }
    }

    return edits;
}

function apply_edits(edits, string) {
    var str = string.split('');
    for (var i=0; i<edits.length; i++) {
        var edit = edits[i];
        if (edit.type == 'substitution') {
            str[edit.index] = edit.character;
        }
        else if (edit.type == 'deletion') {
            str.splice(edit.index, 1);
        }
        else if (edit.type == 'insertion') {
            str.splice(edit.index, 0, edit.character);
        }
//        console.log(str.join(''));
    }
    return str.join('');
}

function random_string(length) {
    var characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ".split('');
    var string = "";
    for (var i=0; i<length; i++) string += characters[Math.floor(Math.random() * characters.length)];
    return string;
}

function test(a, b) {
    var edits = edits_between(a, b);
 //   console.log(edits);
    var result = apply_edits(edits, b);
//    console.log(a);
//    console.log(result);
    console.log(result == a)
}
//*
for (var i=0; i<10; i++) {
    var a = random_string(Math.floor(Math.random() * 1000));
    var b = random_string(Math.floor(Math.random() * 1000));
    test(a, b);
}
//*/


test(
    "bbbc",
    "a"
)
