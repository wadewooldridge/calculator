/**
 * Created by Wade on 10/10/2016.
 */
var gCalculator = null;

/* Program initialization. */
$(document).ready(function () {
    console.log('Document ready.');

    gCalculator = new calculator(callback);
    console.log('gCalculator: ', gCalculator);

    /* Set up all the click handlers once the document is ready. */
    $('button').click(onButtonClick);
});

/* Main click handler - just calls the Processor object handler and displays the return value. */
function onButtonClick() {
    var text = $(this).text();
    console.log('Clicked:', text);

    // Convert my buttons to the text desired by the LFZ calculator module.
    switch (text) {
        case 'C':
        case 'CE':
            gCalculator.allClear();
            break;
        case 'X':
            gCalculator.addItem('x');
            break;
        default:
            gCalculator.addItem($(this).text());
            break;
    }
}

//callback function defined
function callback(type, value, item) {
    switch (value) {
        case undefined:
            $('#display').html("");
            break;
        default:
            $('#display').html(value);
            break;
    }
}
