$(function () {
    function disable(e) {e.preventDefault();}
    window.addEventListener('touchstart', disable);
    window.addEventListener('touchmove', disable);
    window.addEventListener('touchend', disable);
});
