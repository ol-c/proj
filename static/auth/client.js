$(function () {
    var email_pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z][A-Za-z]+$/;

    var input = $('<input>');
    input
        .attr('type', 'email')
        .attr('placeholder', 'email');
    var button = $('<button>')
        .text('login');

    $(document.body)
        .css({
            textAlign : 'center'
        })
        .append([input, button]);
    input.focus();

    function login() {
        if (email_pattern.test(input.val())) {
            input.css({
                color : 'black'
            });
            $.ajax({
                method : 'POST',
                data : input.val(),
                success : function (response) {
                    console.log(response);
                },
                error : function (error) {
                    console.log(error);
                }
            });
        }
        else {
            input.css({
                color : 'red'
            });
        }
    }

    button.on('click', function () {
        input.focus();
        login();
    });
    
    input.on('keydown', function (e) {
        if (e.which == 13) {
            login();
        }
        else {
            input.css({
                color : 'black'
            });
        }
    });
});
