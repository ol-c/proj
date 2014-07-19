$.fn.render.file = function (item, after, parent_node) {
    var self = this;

    var reference = item.reference;

    var download = item.data.url;
    if (download && download.substring(0, 7) == 'http://') {
        download = item.data.url;
    }
    else if (download) {
        download = 'http://files.' + document.domain + '/' + item.data.url;
    }
    var uploaded = false;
    var uploading = false;
    var highlighter = null;
    var unhighlighter = null;
    var on_return = null;
    var type;

    var icon_height = 3; //em


    var renderers = {
        'text/*' : function (content_type, response) {
            var container = $('<div>');
            container.css({
                width : (icon_height * 8.5/11) + 'em',
                height : icon_height + 'em',
                padding : (icon_height * 1.5/11) + 'em',
                background : 'beige',
                border : '2px solid rgba(0,0,0,0)',
                overflow : 'hidden',
                display : 'inline-block',
                verticalAlign : 'middle'
            });
            highlighter = function () {
                container.css({borderColor : 'orange'});
            };
            unhighlighter = function () {
                container.css({borderColor : 'rgba(0,0,0,0)'});
            };
            //  TODO: find something that is a nicely frameable page
            //        and toy with wrapping
            if (response.length > 1000) {
                response = response.substring(0, 1000);
            }
            container.text(response);
            container.behave({
                'fitText' : {alignment : 'top'},
            });
            return container;
        },
        'image/.*' : function () {
            var image = $('<img>');
            image.css({
                border : '2px solid rgba(0,0,0,0)',
                height : icon_height + 'em',
                verticalAlign : 'middle'
            });
            highlighter = function () {
                image.css('border', '2px solid orange');
            }
            unhighlighter = function () {
                image.css('border', '2px solid rgba(0, 0, 0, 0)');
            }
            image.attr('src', download);
            return image;
        },
        '.*/.*' : function (content_type, response) {
            content_type = content_type.split('/', 2);
            var maintype = $('<span>').text(content_type[0]);
            var subtype = $('<span>').text('/'+content_type[1]);
            maintype.css({color : 'black'});
            subtype.css({color : '#888888'});
            var download_button = $('<div>');
            download_button.css({
                color : 'white',
                background : '#EEEEEE',
                display : 'inline-block',
                padding : '0 1ch'
            })
            download_button.append([maintype, subtype]);
            download_button.hammer().on('tap', function () {
                window.location.assign(download);
            });
            unhighlighter = function () {
                download_button.css({background : '#EEEEEE'});
            }
 
            highlighter = function () {
                download_button.css({background : 'orange'});
            }
            return download_button;
        }
    };

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

    self.on('select', function (e) {
        e.stopImmediatePropagation();
        highlight();
    });
    self.on('unselect', function (e) {
        e.stopImmediatePropagation();
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
                    var script = reference_source('this', reference.slice(1)) + ' = new File("' + filename + '")';
                    evaluate_script([reference[0]], script, function (response) {
                        render();
                    });
                }
            }

            var extension_types = {
                'json' : 'text/json'
            };

            var type = file.type

            if (type === "" || type === undefined) {
                var extension = file.name.split('.').pop();
                if (extension_types[extension]) {
                    type = extension_types[extension];
                }
            }

            $.ajax({
                url : 'http://files.' + document.domain + '/',
                data : {
                    ContentType : type
                },
                success : function (response) {
                    filename = response.filename;
                    download = 'http://files.' + document.domain + '/' + filename;

                    upload(response.upload, file, type, progress, done);
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
        highlighter = function () {
            loading.css({background : 'orange'});
        };

        unhighlighter = function () {
            loading.css({background : 'none'});
        }
        self.empty();
        $.ajax({
            method : 'GET',
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
                if (type == undefined) {
                    var bottom = $('<div>');
                    bottom.css({
                        display : 'inline-block',
                        verticalAlign : 'bottom'
                    });
                    self.append(renderers['.*/.*']('type/unknown', response));
                    self.append(bottom);
                    bottom.append(after);
                }
                else {
                    for (var renderer in renderers) {
                        if (type.match(new RegExp(renderer))) {
                            var bottom = $('<div>');
                            bottom.css({
                                display : 'inline-block',
                                verticalAlign : 'bottom'
                            });
                            self.append(renderers[renderer](type, response));
                            self.append(bottom);
                            bottom.append(after);
                            break;
                        }
                    }
                }
                if (self.selected()) highlight();

            },
            error : function (error) {
                //  try image
                var image = $('<img>');
                image.attr('src', download);
                image.on('load', function () {
                    self.empty();
                    self.append([renderers['image/.*'](), after]);
                });
                image.on('error', function () {
                    var error_message = $("<span>").text("Error loading file: " + download);
                    self.append([error_message, after]);
                });
            }
        });
        var loading = $('<span>Loading</span>');
        loading.css({
            color : 'purple'
        });
        self.append([loading, after]);
    }



    function watch_fn(update) {
        self.empty();
        self.render(update.value, after, parent_node);
        unwatch(item.reference, watch_fn);
    }

    watch(item.reference, watch_fn);

    return {
        change_reference : function (new_reference) {
            unwatch(reference, watch_fn);
            reference = new_reference;
            watch(reference, watch_fn);
        }
    }
};
