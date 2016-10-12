/* Calculator - by Wade Wooldridge */

/* Program constants. */

/* Global data. */
var gProcessor = null;

/* Program initialization. */
$(document).ready(function () {
    console.log('Document ready.');

    /* Set up the main processor. */
    gProcessor = new Processor();
    if (gProcessor.selfTest()) {
        $('#main-display').text('0');
    } else {
        $('#main-display').text('POST Error');
    }

    /* Set up all the click handlers once the document is ready. */
    $('button').click(onButtonClick);

});

/* Main click handler - just calls the Processor object handler and displays the return value. */
function onButtonClick() {
    var text = $(this).text();
    var retObj = gProcessor.onButtonClick(text);

    $('#main-display').text(retObj.value);
    $('#accumulator-display').text(retObj.accumulator);
    $('#operator-display').text(retObj.operator);
}

/* Main Processor object for handling all context and state. */
function Processor() {
    // Initialize state on first construction.
    this.accumulator = '';
    this.operator = '';
    this.value = '';

    // Boolean to lock calculator on error, until cleared.
    this.locked = false;

    // Convenience functions.
    this.clear = function() {
        this.accumulator = '';
        this.operator = '';
        this.value = '';

        if (this.locked) {
            console.log('Lock cleared');
            this.locked = false;
        }
    };

    this.operators = '+-X/';
    this.isOperator = function(text) { return this.operators.indexOf(text) != -1 };

    /* Basic math combinations. */
    this.doTheMath = function() {
        var newValue;
        var accumulatorNum = parseFloat(this.accumulator);
        var valueNum = parseFloat(this.value);

        /* TODO: Fix up decimal places.
         var digits = 0;
         var pointIndex = this.accumulator.indexOf('.');
         if (pointIndex === -1) {
            accumulatorNum = parseInt(this.accumulator);
            } else {
            accumulatorNum = parseFloat(this.accumulator);
            digits = this.accumulator.length - pointIndex - 1;
         }

         pointIndex = this.value.indexOf('.');
         if (pointIndex === -1) {
            valueNum = parseInt(this.value);
            } else {
            valueNum = parseFloat(this.value);
            digits = Math.max(digits, this.value.length - pointIndex - 1);
         }
         */

        switch (this.operator) {
            case '+': newValue = accumulatorNum + valueNum; break;
            case '-': newValue = accumulatorNum - valueNum; break;
            case 'X': newValue = accumulatorNum * valueNum; break;
            case '/': newValue = accumulatorNum / valueNum; break;
            default:  newValue = 0;                         break;
        }

        /* TODO: Fix up decimal places.
         // Strip off trailing zeroes behind the decimal on the result.
         if (newValue != parseInt(newValue)) {
            var valueText = newValue.toFixed(digits).toString();
            while (valueText[valueText.length - 1] === '0') {
                valueText = valueText.substring(0, valueText.length - 1);
            }

            if (valueText[valueText.length - 1] === '.') {
            valueText = valueText.substring(0, valueText.length - 1);
            }
         }
         */

        return newValue;
    };

    /* Main button handler - takes the button and returns an object with accumulator, operator, value strings. */
    this.onButtonClick = function(text) {
        var newValue;

        if (text === 'C') {
            // Handle the C (all clear).
            this.clear();

        } else if (this.locked) {
            // No action except 'C' if we are locked.
            this.value = 'Locked: Clear';

        } else if (text === 'CE') {
            // Handle the CE (clear entry).
            this.value = '';

        } else if ((text >= '0' && text <= '9') ||
            (text === '-' && this.value.length === 0) ||
            (text === '.' && (this.value.indexOf('.') === -1))) {
            // Add to value: (a) number, (b) leading minus sign, or (c) decimal point if not already in string.
            this.value += text;

        } else if (this.isOperator(text)) {
            // Handle operator; if we currently have an operator, finish its math first.
            if (this.operator !== '') {
                // We already have an operator, so finish that operation first with the existing operator.
                newValue = this.doTheMath();
                this.accumulator = newValue.toString();
                this.operator = text;
                this.value = '';
            } else {
                // This is the first operator, so just shift to the accumulator.
                this.accumulator = this.value;
                this.operator = text;
                this.value = '';
            }

        } else if (text === '=') {
            // Handle equal sign.
            if (this.value === '') {
                // If we have no value, re-use the previous value (currently in accumulator).
                this.value = this.accumulator;
            }

            newValue = this.doTheMath();
            this.accumulator = '';
            this.value = newValue.toString();
        } else {

            // Unknown input.
            console.log('Unexpected input: "' + text + '"');
        }

        // Final check for 'NaN', convert to 'Error'.
        if (this.value === 'NaN' || this.value === 'Infinity') {
            console.log('Error - locking calculator until \'C\'');
            this.value = 'Error';
            this.locked = true;
        }

        // Return the current settings; the only exception is display '0' or space for an empty value.
        return {
            accumulator : (this.accumulator === '') ? '' : this.accumulator,
            operator : (this.operator === '') ? '' : this.operator,
            value: (this.value === '') ? '0' : this.value
        }
    };

    /* Data for the self-test routine: as each key is pressed, check that the returned display is correct. */
    this.testArray = [
        {name: 'Basic addition', steps: [ // 123 + 456 = 579
            'C', '0',
            '1', '1',
            '2', '12',
            '3', '123',
            '+', '0',
            '4', '4',
            '5', '45',
            '6', '456',
            '=', '579' ]},
        {name: 'Basic subtraction, decimals', steps: [ // 42.5 - 21.7 = 20.8  (Note: picked to _not_ get floating error).
            'C', '0',
            '4', '4',
            '2', '42',
            '.', '42.',
            '5', '42.5',
            '-', '0',
            '2', '2',
            '1', '21',
            '.', '21.',
            '7', '21.7',
            '=', '20.8' ]},
        {name: 'Basic multiplication', steps: [ // 72 * 3 = 216
            'C', '0',
            '7', '7',
            '2', '72',
            'X', '0',
            '3', '3',
            '=', '216' ]},
        {name: 'Basic division', steps: [ // 56 / 4 =
            'C', '0',
            '5', '5',
            '6', '56',
            '/', '0',
            '4', '4',
            '=', '14' ]},
        {name: 'Successive operation', steps: [ // 4 + 5 + 6 = 15
            'C', '0',
            '4', '4',
            '+', '0',
            '5', '5',
            '+', '0',
            '6', '6',
            '=', '15' ]},
        {name: 'Multiple decimals', steps: [ // 1...2 + 2...1 = 3.3
            'C', '0',
            '1', '1',
            '.', '1.',
            '.', '1.',
            '.', '1.',
            '2', '1.2',
            '+', '0',
            '2', '2',
            '.', '2.',
            '.', '2.',
            '.', '2.',
            '1', '2.1',
            '=', '3.3' ]},
        {name: 'Negative operands', steps: [ // -4 - -9 = 5
            'C', '0',
            '-', '-',
            '4', '-4',
            '-', '0',
            '-', '-',
            '9', '-9',
            '=', '5' ]},
        {name: 'Division by zero', steps: [ // 1 / 0 = Error, locks calculator
            'C', '0',
            '1', '1',
            '/', '0',
            '0', '0',
            '=', 'Error',
            '4', 'Locked: Clear',
            'C', '0' ]},
        {name: 'Successive multi-operation', steps: [ // 1 + 3 / 4 + 10 * 2 = 22
            'C', '0',
            '1', '1',
            '+', '0',
            '3', '3',
            '/', '0',
            '4', '4',
            '+', '0',
            '1', '1',
            '0', '10',
            'X', '0',
            '2', '2',
            '=', '22' ]},
        {name: 'Operation repeat', steps: [
            'C', '0',
            '2', '2',
            '+', '0',
            '5', '5',
            '=', '7',
            '=', '12',
            '=', '17' ]}
    ];

    /* Main self-test routine and validation routine (using the arrays above); returns success boolean. */
    this.selfTest = function() {
        for (var testNum = 0; testNum < this.testArray.length; testNum++) {
            console.log('testNum', testNum);
            var testName = this.testArray[testNum].name;
            var testSteps = this.testArray[testNum].steps;

            for (var stepNum = 0; stepNum < testSteps.length; stepNum += 2) {
                var stepInput = testSteps[stepNum];
                var expected = testSteps[stepNum + 1];

                var obj = this.onButtonClick(stepInput);
                if (obj.value !== expected) {
                    console.log('selfTest error on test "' + testName + '" step ' + (stepNum / 2) +
                                ': expected "' + expected + '", got "' + obj.value + '"');
                    return false;
                }
            }
        }
        return true;
    }
}