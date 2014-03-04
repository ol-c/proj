$.fn.upload = function (options, callback) {
    var progress  = options.progress;
    $(this).on('change', function (event) {
        var file = this.files[0];
        progress(0);
        getSignedURLs(file.type, function (err, urls) {
            if (err) callback(err);
            else     upload(urls, file, progress, callback);
        });
    });
    function upload(urls, file, progress, cb) {
        function success ()    { cb(null, urls.download); }
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
            url         : urls.upload,
            contentType : file.type,
            data        : file,
            processData : false,
            success     : success,
            error       : error,
            xhr         : onProg
        };
        $.ajax(request);
    }
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
