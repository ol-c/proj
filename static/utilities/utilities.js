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
    var last_args = [];
    var internal = {};
    function check_ready(check_internal) {
        if (check_internal !== internal) {
            last_args = arguments;
        }
        if (last_execution == null) {
            last_execution = Date.now();
        }
        var ms_since = Date.now() - last_execution;
        if (ms_since < ms_between) {
            var wait = ms_between - ms_since;
            timeouts.push(setTimeout(function () {
                check_ready(internal);
            }, wait));
        }
        else {
            last_execution = Date.now();
            fn.apply(fn, last_args);
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
            if (insertion <= substitution && insertion <= deletion) {
                operations.push('insertion');
                j -= 1;
            }
            else if (substitution <= insertion && substitution <= deletion) {
                operations.push('substitution');
                i -= 1;
                j -= 1;
            }
            else {
                operations.push('deletion');
                i -= 1;
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

//    console.log(actual_edits, matrix[matrix.length-1][matrix[0].length-1])

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
                i += 1;
                j += 1;
            }
            else if (op == 'deletion') {
                i += 1;
            }
            else if (op == 'insertion') {
                j += 1;
            }
//            console.log(edit);
            edits.push(edit);
        }
    }

    return edits;
}

//  From is an array of objects to apply edits to
//  sub is function that performs substitution
//  del is function that performs deletion
//  ins is function that performs insertion
function apply_edits(edits, from, sub, del, ins) {
    for (var i=0; i<edits.length; i++) {
        var edit = edits[i];
        if (edit.type == 'substitution') {
            sub(edit.index, from[edit.index]);
        }
        else if (edit.type == 'deletion') {
            del(edit.index);
        }
        else if (edit.type == 'insertion') {
            ins(edit.index, from[edit.index]);
        }
//        console.log(str.join(''));
    }
}

/*
function random_string(length) {
    var characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ".split('');
    var string = "";
    for (var i=0; i<length; i++) string += characters[Math.floor(Math.random() * characters.length)];
    return string;
}

function test(a, b) {
    var edits = edits_between(a, b);
 //   console.log(edits);
    var str = b.split('');
    apply_edits(edits, a.split(''),
        function sub(index, item) {
            str[index] = item;
        },
        function del(index) {
            str.splice(index, 1);
        },
        function ins(index, item) {
            str.splice(index, 0, item)
        });
//    console.log(a);
//    console.log(result);
    console.log(str.join('') == a)
}

for (var i=0; i<100; i++) {
    var a = random_string(Math.floor(Math.random() * 100));
    var b = random_string(Math.floor(Math.random() * 100));
    test(a, b);
}
//*/

/*
function (fileoptions, callback) {
    var progress  = options.progress;
    $(this).on('change', function (event) {
        var file = this.files[0];
        progress(0);
        getSignedURLs(file.type, function (err, urls) {
            if (err) callback(err);
            else     upload(urls, file, progress, callback);
        });
    });
*/

function upload(upload_url, file, progress, cb) {
    progress(0);
    function success ()    { cb(null); }
    function error   (err) { cb(err); }
    function onProg () {
        // Custom XMLHttpRequest
        var XHR = $.ajaxSettings.xhr();
        // if upload property handle progress
        if (XHR.upload) {
            var uploader = XHR.upload;
            function onProg(e) {
                var loaded = e.loaded || e.position;
                var total = e.total || e.totalSize;
                progress(loaded / total);
            }
            uploader.addEventListener('progress', onProg);
        }
        return XHR;
    }
    var request = {
        method      : 'PUT',
        url         : upload_url,
        data        : file,
        processData : false,
        success     : success,
        error       : error,
        xhr         : onProg
    };
    if (file.type.length) request.contentType = file.type;
    else request.contentType = 'binary/octet-stream';
    $.ajax(request);
}

/*
    function getSignedURLs(type, cb) {
        function success(urls) {
            cb(null, JSON.parse(urls));
        }
        function error (xhr, status, err) {
            cb(err);
        }
        var request = {
            method  : 'GET',
            url     : '/files/',
            data    : { ContentType : type },
            success : success,
            error   : error
        };
        $.ajax(request);
    }
}
*/
