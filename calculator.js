/* Calculator - by Wade Wooldridge */

/* Program constants. */

/* Global data. */
var gProcessor = null;

/* Program initialization. */
$(document).ready(function () {
    console.log('Document ready.');

    /* Set up the main processor. */
    gProcessor = new Processor();
    $('#display').text(gProcessor.selfTest());

    /* Set up all the click handlers once the document is ready. */
    $('button').click(onButtonClick);

});

/* Main click handler - just calls the Processor object handler and displays the return value. */
function onButtonClick() {
    var text = $(this).text();
    console.log('Clicked:', text);

    $('#display').text(gProcessor.onButtonClick(text));
}

/* Main Processor object for handling all context and state. */
function Processor() {
    /* Initialize state on first constuction. */


    /* Main button handler. */
    this.onButtonClick = function(text) {
        return 'Got: ' + text;
    }

    /* Data for the self-test routine: as each key is pressed, check that the returned display is correct. */
    this.testArray = [{name: 'Basic addition', steps: [ // 123 + 456 = 579
        'C', '0',
        '1', '1',
        '2', '12',
        '3', '123',
        '+', '0',
        '4', '4',
        '5', '45',
        '6', '456',
        '=', '579'
    ]}];

    /* Main self-test routine; this doubles as the validation routine using the arrays above. */
    this.selfTest = function() {
        for (var testNum = 0; testNum < this.testArray.length; testNum++) {
            var testName = this.testArray[testNum].name;
            var testSteps = this.testArray[testNum].steps;

            for (var stepNum = 0; stepNum < (testSteps.length / 2); stepNum += 2) {
                var stepInput = testSteps[stepNum];
                var expected = testSteps[stepNum + 1];

                var got = this.onButtonClick(stepInput);
                if (got !== expected) {
                    console.log('selfTest error on test "' + testName + '" step ' + (stepNum / 2) +
                                ': expected "' + expected + '", got "' + got + '"');
                    return 'Self-test error';
                }
            }
        }
        return "Ready";
    }
}