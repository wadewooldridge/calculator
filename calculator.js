/* Calculator - by Wade Wooldridge */

/* Program constants. */

/* Global data. */
var gCalculator = null;

/* Program initialization. */
$(document).ready(function () {
    console.log('Document ready.');

    // Create the global object for the Calculator.
    gCalculator = new Calculator();
});

/********************************************************************************
 * Calculator object.
 *      Main Calculator object for handling user interface.
 ********************************************************************************/
function Calculator() {
    console.log('Calculator: constructor');
    // Save Calculator object reference, as 'this' will refer to DOM  or timer objects in some methods.
    var self = this;

    // Save the jQuery DOM references for use later.
    this.mainDisplay = $('#main-display');
    this.accumulatorDisplay = $('#accumulator-display');
    this.operatorDisplay = $('#operator-display');
    this.impliedDisplay = $('#implied-display');
    this.panelFooter = $('.panel-footer');
    this.historyLogDisplay = $('#history-log-display');

    // Create the global object for the Processor behind the Calculator.
    this.processor = new Processor();

    // Create a space for a Tester object when running the animation.
    this.tester = null;
    this.activeSelector = null;

    // Perform self-test on the related Processor, and display the results.
    this.doSelfTest = function () {
        if (this.processor.selfTest()) {
            this.processor.clear();
            this.mainDisplay.text('0');
        } else {
            this.mainDisplay.text('POST Error');
        }
    };

    // Initialization.
    this.initialize = function () {
        // Perform the self-test.
        this.doSelfTest();

        // Set up all the click handlers for this Calculator.
        $('button').not('.toggle-dropdown').click(this.onButtonClick);

        // Set up the keypress event handler.
        $(document).keypress(this.onKeypress);

        // Set up the change event handlers for the check boxes and menu items in the hamburger menu.
        $('#expanded-displays').change(this.onExpandedDisplaysChange);
        $('#history-log').change(this.onHistoryLogChange);
        $('#perform-self-test').click(this.onPerformSelfTest);
    };

    // Main click handler - just calls the Processor object handler and displays the return values.
    this.onButtonClick = function() {
        var text = $(this).text();
        // console.log('onButtonClick: ' + text);
        var retObj = self.processor.handleText(text);
        self.updateDisplay(retObj);
    };

    // Change handler for checkbox: Expanded Displays.
    this.onExpandedDisplaysChange = function() {
        console.log('onExpandedDisplaysChange checked=' + this.checked);
        var domObjects = ['.panel-body label', '#accumulator-display', '#operator-display', '#implied-display'];

        for (var i = 0; i < domObjects.length; i++) {
            if (this.checked) {
                $(domObjects[i]).show();
            } else {
                $(domObjects[i]).hide();
            }
        }
    };

    // Change handler for checkbox: History Log.
    this.onHistoryLogChange = function() {
        console.log('onHistoryLogChange checked=' + this.checked);

        if (this.checked) {
            $('.panel-footer').show();
        } else {
            $('.panel-footer').hide();
        }
    };

    // Main keypress handler - just calls the Processor object handler and displays the return values.
    this.onKeypress = function(event) {
        var c = event.which || event.keyCode;
        var text = String.fromCharCode(c);
        console.log('onKeypress: ' + text);

        // Do some basic checks and conversions to make it easier on the user.
        if ('0123456789+-CX/.='.indexOf(text) === -1) {
            if (text === 'x' || text === '*') {         // Convert x or * to X.
                text = 'X';
            } else if (text === 'c') {                  // Convert c to C.
                text = 'C';
            } else if (text === 'e' || text === 'E') {  // Convert e or E to CE.
                text = 'CE';
            } else if (c === 13) {                      // Convert Enter to =.
                text = '=';
            } else {
                console.log('Ignoring code: ' + c);
                text = '';
            }
        }

        // If we got something valid, give it to the Processor.
        if (text !== '') {
            var retObj = self.processor.handleText(text);
            self.updateDisplay(retObj);
        }
    };

    // Handler for menu option: Perform Self-Test.  See also onSelfTestTimeout.
    this.onPerformSelfTest = function() {
        console.log('onPerformSelfTest');
        self.tester = new Tester();
        self.tester.reset();

        // Get the first test and start the timer; the rest is handled in onSelfTestTimeout.
        var testName = self.tester.getNextTest();
        console.log('onPerformSelfTest: ' + testName);
        self.updateHistoryDisplay('Starting self-test: ' + testName);
        setTimeout(self.onSelfTestTimeout, 100);
    };

    // Handler for the timeout for onPerformSelfTest: move on to the next item in the test.
    this.onSelfTestTimeout = function() {
        // Clear any old active button.
        if (self.activeSelector !== null) {
            $(self.activeSelector).removeClass('active');
            self.activeSelector = null;
        }

        // Process this single step; if there isn't one, go to the next test and process the first step of that.
        var testStep = self.tester.getNextStep();
        if (testStep === null) {
            var testName = self.tester.getNextTest();
            if (testName === null) {
                console.log('onSelfTestTimeout: self-test complete.');
                self.updateHistoryDisplay('Self-test complete.');
                return;
            } else {
                // console.log('onSelfTestTimeout: ' + testName);
                self.updateHistoryDisplay('Starting self-test: ' + testName);
                testStep = self.tester.getNextStep();
            }
        }

        // We have the next step, so let's execute it.
        var input = testStep.input;
        var expected = testStep.expected;
        
        // Activate the current button. Special selector for 'C' to keep from also toggling 'CE'.
        if (input === 'C'){
            self.activeSelector = '#clear-all';
        } else {
            self.activeSelector = 'button:contains("' + input + '")';
        }
        $(self.activeSelector).addClass('active');

        // Handle it to the Processor for execution.
        var retObj = self.processor.handleText(input);
        self.updateDisplay(retObj);
        if (retObj.value !== expected) {
            self.updateHistoryDisplay('Self-test error: expected "' + expected + '", got "' +
                retObj.value + '"');
        }

        // Set the timeout to come back here for the next step; give extra time for '='.
        setTimeout(self.onSelfTestTimeout, (input === '=') ? 1000 : 150);
    };

    // Update the Calculator fields with the components of a results object.
    this.updateDisplay = function(retObj) {
        this.mainDisplay.text(retObj.value);
        this.accumulatorDisplay.text(retObj.accumulator);
        this.operatorDisplay.text(retObj.operator);
        this.impliedDisplay.text(retObj.implied);

        for (var i = 0; i < retObj.logArray.length; i++) {
            var message = retObj.logArray[i];

            // Fix up some messages from the Processor.
            if (message === "Clear") {
                message = 'Clear ---------';
            }
            this.updateHistoryDisplay(message);
        }
    };

    // Log a message to the history log display and scroll it.
    this.updateHistoryDisplay = function(message) {
        this.historyLogDisplay.append($('<p>').text(message));
        this.panelFooter.scrollTop(this.historyLogDisplay.prop('scrollHeight'));
    };

    // Call the initialize method defined above.
    this.initialize();

} // Calculator

/********************************************************************************
 * Processor object.
 *      Main Processor object for handling all context and state.
 ********************************************************************************/
function Processor() {
    console.log('Processor: constructor');

    // Initialize state on first construction.
    this.accumulator = '';
    this.operator = '';
    this.value = '';
    this.implied = '';
    this.usedImplied = false;
    this.lastEquals = false;

    // Boolean to lock calculator on error, until cleared.
    this.errorLock = false;

    // Convenience functions.
    this.clear = function () {
        this.accumulator = '';
        this.operator = '';
        this.value = '';
        this.implied = '';
        this.usedImplied = false;
        this.lastEquals = false;

        if (this.errorLock) {
            console.log('Error lock cleared');
            this.errorLock = false;
        }
    };

    this.operators = '+-X/';
    this.isOperator = function (text) {
        return this.operators.indexOf(text) != -1
    };

    /* Basic math combinations. */
    this.doTheMath = function () {
        var newValue;
        var accumulatorNum;
        var valueNum = parseFloat(this.value);

        // If there is nothing in the value, use the implied value.
        if (this.accumulator !== '') {
            accumulatorNum = parseFloat(this.accumulator);
            this.usedImplied = false;
        } else {
            accumulatorNum = parseFloat(this.implied);
            this.usedImplied = true;
        }

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
            case '+':
                newValue = accumulatorNum + valueNum;
                break;
            case '-':
                newValue = accumulatorNum - valueNum;
                break;
            case 'X':
                newValue = accumulatorNum * valueNum;
                break;
            case '/':
                newValue = accumulatorNum / valueNum;
                break;
            default:
                newValue = 0;
                break;
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
    this.handleText = function (text) {
        var newValue;
        var logArray = [];

        if (text === 'C') {
            // Handle the C (all clear).
            this.clear();
            logArray.push('Clear');

        } else if (this.errorLock) {
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
            // Handle operator; if this is premature +X/, ignore it. Minus sign is allowed.
            if (text !== '-' && this.value === '') {
                // If we don't already have an operator, or it is the one we are getting ignore it; else override it.
                if (this.operator === '' || this.operator === text) {
                    console.log('Ignoring premature "' + text + '"');
                } else {
                    console.log('Overriding operator "' + this.operator + '" to "' + text + '"');
                    this.operator = text;
                    logArray.push('Replacement: ' + text);
                }

            } else if (this.operator !== '' && !this.lastEquals) {
                // We already have an operator, so finish that operation first with the existing operator.
                logArray.push(text);
                logArray.push(this.value);
                newValue = this.doTheMath();
                this.accumulator = newValue.toString();
                this.operator = text;
                this.value = '';
            } else {
                // This is the first operator, so just shift to the accumulator.
                logArray.push(this.value);
                this.accumulator = this.value;
                // If we used this.implied, leave it alone for the next time, otherwise save the value.
                if (!this.usedImplied) {
                    this.implied = this.value;
                }
                this.operator = text;
                logArray.push(this.operator);
                this.value = '';
            }

        } else if (text === '=') {
            // Handle equal sign.
            if (this.operator === '') {
                // If there is no operation defined, just ignore it.
                console.log('Ignoring "=" with no operation.');
            } else {
                if (this.value === '') {
                    // If we have no value, re-use the previous value in accumulator, or the implied value.
                    if (this.accumulator !== '') {
                        this.value = this.accumulator;
                        logArray.push(this.accumulator);
                    } else {
                        this.value = this.implied;
                        logArray.push(this.implied);
                    }
                }
                logArray.push(this.value);

                newValue = this.doTheMath();
                this.accumulator = '';
                // If we used this.implied, leave it alone for the next time, otherwise save the value.
                if (!this.usedImplied) {
                    this.implied = this.value;
                }
                this.value = newValue.toString();
                logArray.push('=');
                logArray.push(this.value);
                this.lastEquals = true;
            }

        } else {
            // Unknown input.
            console.log('Unexpected input: "' + text + '"');
        }

        // Set the lastEquals flag based on whether this was an '='.
        this.lastEquals = (text === '=');

        // Final check for 'NaN', convert to 'Error'.
        if (this.value === 'NaN' || this.value === 'Infinity') {
            console.log('Error - locking calculator until \'C\'');
            this.value = 'Error';
            this.errorLock = true;
            this.accumulator = '';
            this.implied = '';
            logArray.push('Error');
        }

        // Return the current settings; the only exception is to display '0' for an empty value in the main display.
        return {
            accumulator: this.accumulator,
            operator: this.operator,
            value: (this.value === '') ? '0' : this.value,
            implied: this.implied,
            logArray: logArray
        }
    };

    /* Main self-test routine and validation routine (using the Tester arrays); returns success boolean. */
    this.selfTest = function() {
        var tester = new Tester();
        tester.reset();

        // Step through each test in turn.
        var testName = tester.getNextTest();
        while (testName != null) {
            console.log('selfTest: ' + testName);

            var testStep = tester.getNextStep();
            while (testStep != null) {
                // console.log('selfTest: ' + testStep.input + ' --> ' + testStep.expected);
                var input = testStep.input;
                var expected = testStep.expected;

                var retObj = this.handleText(input);
                if (retObj.value !== expected) {
                    console.log('selfTest error on test "' + testName +
                        ': expected "' + expected + '", got "' + retObj.value + '"');
                    return false;
                }

                testStep = tester.getNextStep();
            }
            testName = tester.getNextTest();
        }

        return true;
    };

} // Processor

/********************************************************************************
 * Tester object.
 *      Main Tester object.  The Tester object holds a set of tests, where each
 *      test is the text/button that is input to the Calculator, along with the
 *      expected results in the display.  It can be used by the Processor to do
 *      an automated Power-On Self-Test (POST), or used by the Calculator in
 *      response to an animated Self-Test request.
 *
 *      The normal sequence is to call:
 *      - reset()           to reset the counters.
 *      - getNextTest       to get the next test name (until it returns null).
 *      - getNextStep       to get the next test step (until it returns null).
 ********************************************************************************/
function Tester() {
    console.log('Tester: constructor');

    // These class variables and methods are for the calling class to go step-by-step through the self-test steps.
    this.currentTestNum = -1;
    this.currentStepNum = -2;

    this.currentTestName = function() {
        return this.testArray[this.currentTestNum].name;
    };

    // Go on to the next test; return the name, or null if we are done.
    this.getNextTest = function() {
        var retName = null;
        if (++this.currentTestNum < this.testArray.length) {
            retName = this.testArray[this.currentTestNum].name;
            // console.log('getNextSelfTest: moving to ' + retName);
            this.currentStepNum = -2;
        }
        return retName;
    };

    // Go on to the next step; return the step object, or null if we are done.
    this.getNextStep = function() {
        var retObj = null;
        var steps = this.testArray[this.currentTestNum].steps;
        this.currentStepNum += 2;

        if (this.currentStepNum < steps.length) {
            // console.log('getNextSelfTest: moving to step ' + this.currentStepNum);
            retObj = {input: steps[this.currentStepNum],
                      expected: steps[this.currentStepNum + 1]};
        }
        return retObj;
    };

    // Reset the test counters.
    this.reset = function() {
        this.currentTestNum = -1;
        this.currentStepNum = -2;
    };

    // Data for the self-test routine: as each key is pressed, check that the returned display is correct.
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
        {name: 'Multiple operator keys', steps: [ // 7 + + + 21 = 28
            'C', '0',
            '7', '7',
            '+', '0',
            '+', '0',
            '+', '0',
            '2', '2',
            '1', '21',
            '=', '28' ]},
        {name: 'Changing operator key', steps: [ // 4 + / X 9 = 36
            'C', '0',
            '4', '4',
            '+', '0',
            '/', '0',
            'X', '0',
            '9', '9',
            '=', '36' ]},
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
        {name: 'Operation repeat', steps: [ // 2 + 5 = = = 17
            'C', '0',
            '2', '2',
            '+', '0',
            '5', '5',
            '=', '7',
            '=', '12',
            '=', '17' ]},
        {name: 'Premature operator', steps: [ // + X / + 2 * 3 = 6, note that minus becomes negative number.
            'C', '0',
            '+', '0',
            'X', '0',
            '/', '0',
            '2', '2',
            'X', '0',
            '3', '3',
            '=', '6' ]},
        {name: 'Partial operand', steps: [ // 3 * = 9
            'C', '0',
            '3', '3',
            'X', '0',
            '=', '9' ]},
        {name: 'Missing operation', steps: [ // 3 = 3
            'C', '0',
            '3', '3',
            '=', '3',
            'X', '0',
            '6', '6',
            '=', '18' ]},
        {name: 'Missing operands', steps: [ // = = = =
            'C', '0',
            '=', '0',
            '=', '0',
            '=', '0',
            '5', '5',
            '/', '0',
            '2', '2',
            '=', '2.5' ]},
        {name: 'Operation rollover', steps: [ // 1 + 1 + = + = 8
            'C', '0',
            '1', '1',
            '+', '0',
            '1', '1',
            '+', '0',
            '=', '4',
            '+', '0',
            '=', '8' ]},
        {name: 'Clear entry', steps: [ // 5 X 623 CE 12 = 60
            'C', '0',
            '5', '5',
            'X', '0',
            '6', '6',
            '2', '62',
            '3', '623',
            'CE', '0',
            '1', '1',
            '2', '12',
            '=', '60' ]}
    ];
} // Tester
