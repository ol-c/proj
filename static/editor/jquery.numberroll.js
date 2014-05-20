$.fn.numberroll = function (start_digits, max_digits) {
    max_digits = max_digits || Infinity;
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

        digit.on('change', function (event) {
            while (digits.length > start_digits
                   && digits[0] !== digit
                   && digits[0].text() == '0') {
                digits.shift().remove();
            }
            if (digits[0].selected() && digits[0].text() !== '0' && digits[0] == digit && digits.length < max_digits) {
                add_digit();
            }
            event.stopPropagation();
            self.trigger('change', parseInt(self.text()));
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

    self.on('update', function (event, number) {
        if (event.target !== self[0]) {
            //  update is propagated from child here
        }
        else {
            var offset = 0;
            var digit = number % 10;
            while (digits.length - offset > 0) {
                digits[digits.length - offset - 1].trigger('update', digit);
                number = (number - digit) / 10;
                digit = number % 10;
                offset += 1;
                if (digits.length == offset && number) {
                    add_digit();
                }
            }
        }
    });

    self.append(digits);
}
