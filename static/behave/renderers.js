function render(object, element) {
    var renderers = {
        'titled_image' : function (object) {
            var title = object.title;
            var image_src = object.image;
            var source = object.source;

            var container = $('<div>');
            var title_tag = $('<div>');
            var image_container = $('<div>');
            var image = $('<img>');
            
            title_tag.text(title);
            image.attr('src', image_src);
            title_tag.height(100);
            
            
            $('body').append(title_tag);
            
            title_tag.behave({
                fitText : true
            });
            
            
            image_container.append(image);
            container.append([title_tag, image_container]);
            container.behave({
                fill : true
            });
            image_container.behave({
                fill : {vertical_fit : true}
            });
            image.behave({
                fit : {align : 'center'},
                zoomable : true
            });
            return container;
        },
        'plain_image' : function (object) {
            var image_src = object.image;
            var source = object.source;
            
            var container = $('<div>');
            var image = $('<img>');

            image.attr('src', image_src);

            container.append(image);
            container.behave({
                fill : true
            });
            image.behave({
                fit : {align : 'center'},
                zoomable : true
            });
            return container;
        },
        'quote' : function (object) {
            var quote = object.quote;
            var attribution = object.attribution;

            var container = $('<div>');
            var quote_span = $('<span>');
            quote_span.text('"' + quote + '"');
            container.css({textAlign : 'center'})
            container.append(quote_span)
            if (attribution && attribution != '') {
                var attribution_span = $('<div>');
                attribution_span.text('- ' + attribution);
                container.append(attribution_span);
                attribution_span.css({
                    textAlign : 'right',
                    padding : '0.5em',
                    fontSize : '0.75em',
                    color : '#777777'
                });
            }
            $('body').append(container);
            container.behave({
                fill :true
            });
            container.behave({
                fitText : true
            });
            return container;
        },
        'dialogue' : function (object) {
            var speakers = object.speakers;
            var dialogue = object.dialogue;
            var container = $('<div>');
            for (var i = 0; i < speakers.length; i++) {
                var speaker = $('<div>');
                var said = $('<div>')
                speaker.text(speakers[i]);
                said.text(dialogue[i]);
                container.append([speaker, said]);
                
                speaker.css({
                    fontWeight : 'bold',
                    paddingTop : '0.25em',
                    paddingLeft : '0.25em',
                    paddingRight : '0.25em',
                });
                
                said.css({
                    paddingLeft : '1em'
                });
            }
            $('body').append(container);
            container.behave({
                fill : true
            });
            container.behave({
                fitText : true
            });
            return container;
        }
    };

    var renderer = renderers[object.renderer];
    var rendered;

    if (renderer) rendered = renderer(object)
    else {
        rendered = $('<pre>');
        rendered.text('no renderer for:\n' + JSON.stringify(object, null, 4));
    }

    return rendered;
}
