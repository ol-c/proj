$.fn.render.file = function (item, after) {
    var self = this;

    var download = item.data.url;
    console.log(item)
    if (download) {
        download = 'http://files.' + document.domain + '/' + item.data.url;
    }
    var uploaded = false;
    var uploading = false;
    var highlighter = null;
    var unhighlighter = null;
    var on_return = null;
    var type;


    var renderers = {
        'text/*' : function () {
            var container = $('<div>');
            container.css({
                width : '2em',
                height : '2.75em',
                padding : '0.25em',
                border : '1px solid #CCCCCC',
                overflow : 'hidden',
                display : 'inline-block',
                verticalAlign : 'middle'
            });
            highlighter = function () {
                container.css({borderColor : 'orange'});
            };
            unhighlighter = function () {
                container.css({borderColor : '#CCCCCC'});
            };
            $.ajax({
                url : download,
                success : function (response) {
                    //  TODO: find something that is a nicely frameable page
                    //        and toy with wrapping
                    if (response.length > 1000) {
                        response = response.substring(0, 1000);
                    }
                    container.text(response);
                    container.behave({
                        'fitText' : {alignment : 'top'},
                    });
                },
                error : function () {
                    console.log('error');
                }
            })
            return container;
        },
        'binary/*' : function (content_type) {
            var download_button = $('<span>');
            download_button.text(content_type);
            download_button.hammer().on('tap', function () {
                window.location.assign(download);
            });
            download_button.css({color : 'darkmagenta'});
            unhighlighter = function () {
                download_button.css({color : 'darkmagenta'});
            }
 
            highlighter = function () {
                download_button.css({color : 'orange'});
            }
            return download_button;
        }
    }

    self.selectable();
    self.hammer().on('touch', function () {
        self.trigger('select');
    });
    var timeouts = [];
    function highlight() {
        var time_on = 1000;
        var time_off = 500;
        if (self.selected()) {
            while (timeouts.length) {
                clearTimeout(timeouts.pop());
            }
            if (highlighter) highlighter();
            timeouts.push(setTimeout(function () {
                if (unhighlighter) unhighlighter()
                timeouts.push(setTimeout(highlight, time_off));
            }, time_on));
        }
        else {
            if (unhighlighter) unhighlighter();
        }
    }

    self.on('select', function () {
        highlight();
    });
    self.on('unselect', function () {
        highlight();
    })
    $(window).on('keydown', function (e) {
        if (self.selected()) {
            if (e.which == 37) {
                e.stopImmediatePropagation();
                self.trigger('select_prev');
            }
            else if (e.which == 39) {
                e.stopImmediatePropagation();
                self.trigger('select_next');
            }
            else if (e.which == 13 && on_return) {
                on_return();
            }
        }
    });


    if (download == undefined) {
        var uploader = $('<input type="file">');

        uploader.on('blur', function () {
            if (self.selected()) {
                uploader.focus();
            }
        })

        highlighter = function () {
            text.css({
                color : 'orange'
            });
            uploader.focus();
        }

        unhighlighter = function () {
            text.css({
                color : 'darkmagenta'
            });
            uploader.blur();
        }


        uploader.on('change', function (event) {
            var file = this.files[0];

            uploading = true;

            var progress_bar = $('<div>');
            progress_bar.css({
                background : '#EEEEEE',
                position : 'absolute',
                borderTop : '0.25em solid #DDDDDD',
                bottom : 0,
                left : 0,
                right : 0,
                height : 0
            });

            upload_container.prepend(progress_bar);

            text.css({
                fontSize : '1em',
                color : 'darkmagenta'
            });

            function progress(progress) {
                text.text(parseInt(progress * 100) + '%');
                progress_bar.height(progress * upload_container.innerHeight());
                center_text();
            }

            function done(err) {
                uploaded = true;
                if (err) {
                    console.log(err);
                }
                else {
                    var script = 'this.' + item.reference.internal + ' = new File("' + filename + '")';
                    evaluate_script({id : item.reference.id}, script, function (response) {
                        console.log(response)
                        render();
                    });
                }
            }

            $.ajax({
                url : 'http://files.' + document.domain + '/',
                data : {
                    ContentType : file.type
                },
                success : function (response) {
                    filename = response.filename;
                    download = 'http://files.' + document.domain + '/' + filename;
                    upload(response.upload, file, progress, done);
                },
                error : function (error) {
                    console.log(error);
                }
            })
        });
        function center_text() {
            var w = text.width();
            var h = text.height();
            text.css({
                left : (text.parent().width() - w)/2,
                top : (text.parent().height() - h)/2
            });
        }
        var upload_container = $('<span>');
        var text = $('<div>&#8682;</div>');
        upload_container.append(text);
        upload_container.css({
            position : 'relative',
            background : 'white',
            color : 'darkmagenta',
            borderRadius : '3ex',
            border : '4px solid darkmagenta',
            overflow : 'hidden',
            display : 'inline-block',
            verticalAlign : 'middle',
            fontSize : '1em',
            fontWeight : 'bold',
            width : '5ex',
            height : '5ex',
            margin : '0.25ex',
            marginLeft : 0
        });
        text.css({
            position : 'absolute',
            fontSize : '2em',
            lineHeight : '1em'
        });
        upload_container.append(uploader);
        uploader.css({
            opacity : 0,
            position : 'absolute',
            top : '-2em', //  for some reason focus throw off arrow alignment, this fixes it
            left : '-2em',
            bottom : '-2em',
            right : '-2em',
            cursor : 'pointer',
            margin : 0,
            padding : 0,
        });
        self.append([upload_container, after]);
        center_text();
    }
    else {
        render();
    }
    function render() {
        self.empty();
        $.ajax({
            method : 'HEAD',
            url : download,
            success : function (response, textStatus, xhr) {
                self.empty();
                var header_text = xhr.getAllResponseHeaders();
                header_pairs = header_text.split('\n');
                var headers = {};
                for (var i=0; i<header_pairs.length; i++) {
                    var header = header_pairs[i].split(':', 2);
                    if (header.length < 2) continue;
                    headers[header[0].trim()] = header[1].trim();
                }
                type = headers['Content-Type']; 
                var a = $('<a>')
                a.css({
                    textDecoration : 'none',
                    color : 'purple'
                });
                for (var renderer in renderers) {
                    if (type.match(new RegExp(renderer))) {
                        var bottom = $('<div>');
                        bottom.css({
                            display : 'inline-block',
                            verticalAlign : 'bottom'
                        });
                        var f = $('<span>file </span>');
                        f.css({
                            color : '#888888'
                        });
                        self.append(f);
                        self.append(renderers[renderer](type));
                        self.append(bottom);
                        bottom.append(after);
                        break;
                    }
                }
                if (self.selected()) highlight();
            },
            error : function (error) {
                loading.remove();
                var error_placeholder = $('<span>');
                error_placeholder.text('ERROR loading file');
                error_placeholder.css({
                    color : 'red'
                });
                $(self).prepend(error_placeholder);
            }
        });
        var loading = $('<span>Loading</span>');
        loading.css({
            color : 'purple'
        });
        self.append([loading, after]);
    }
};
