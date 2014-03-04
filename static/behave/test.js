var titled_image_funny = {
    renderer : 'titled_image',
    title : 'Bonsai!!!',
    image : 'bonsai.jpg'
};

var plain_image_funny = {
    renderer : 'plain_image',
    image : 'bonsai.jpg'
};

var quote_funny = {
    renderer : 'quote',
    quote : 'Something really funny is a funny thing.',
    attribution : 'Some Body'
};

var dialogue_funny = {
    renderer : 'dialogue',
    speakers : ['a', 'b', 'a'],
    dialogue : [
        'A says Hey B!',
        'B says, Holla!',
        'A says Okay'
    ]
};

$(function () {

    var body = $('body');

    body.css({
        margin : 0,
        overflow : 'hidden'
    });
    
    body.behave({fill:true});

    body.append(render(dialogue_funny));
    
});
