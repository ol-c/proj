$.fn.numberroll = function (start_digits, max_digits) {
    max_digits = max_digits || Infinity;
    console.log(max_digits)
    var self = this;
    var digits = [];

    function add_digit() {
        var new_digit = get_digit()
        digits.unshift(new_digit);
        self.prepend(new_digit);
    }

    function behave(digit) {
        digit.on('unselect', function () {
            while (digits.length > start_digits
//                   && digits[0] !== digit
                   && digits[0].text() == '0'
                   && !digits[0].selected()) {
                digits.shift().remove();
            }
            if (digit.text() == '0' && digits[0] == digit) {
                 if (digits.length > start_digits) {
                     digit.remove();
                     digits.shift();
                 }
            }
        });
        digit.on('select', function () {
            while (digits.length > start_digits
                   && digits[0] !== digit
                   && digits[0].text() == '0') {
                digits.shift().remove();
            }
            if (digits[0].text() !== '0' && digits[0] == digit && digits.length < max_digits) {
                add_digit();
            }
        });

        digit.on('change', function () {
            while (digits.length > start_digits
                   && digits[0] !== digit
                   && digits[0].text() == '0') {
                digits.shift().remove();
            }
            if (digits[0].text() !== '0' && digits[0] == digit && digits.length < max_digits) {
                add_digit();
            }
        });
    }

    for (var i=0; i<start_digits; i++) {
        digits.push(get_digit());
    }

    function get_digit() {
        var options = [];
        for (var j=0; j<10; j++) {
            options.push($('<span>').text(j));
        }
        var digit = $('<span>');
        digit.choose(options);
        behave(digit);
        return digit;
    }

    self.append(digits);
}
