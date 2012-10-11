var settingsAreOpened = false;

// Save default timer values to localStorage.
localStorage['timer-mins'] = localStorage['timer-mins'] || minutesToMilliseconds(75);
localStorage['timeout-mins'] = localStorage["timeout-mins"] || minutesToMilliseconds(6);

document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#timer-mins').addEventListener('keypress', function(){ validateNumber(event); }, false);
	document.querySelector('#timeout-mins').addEventListener('keypress', function(){ validateNumber(event); }, false);
	document.querySelector('#settings-btn').addEventListener('click', toggleSettings);
	document.querySelector('#timer-btn').addEventListener('click', toggleTimerSwitch);
	document.querySelector('#save-settings').addEventListener('click', saveSettings);
	document.querySelector('body').addEventListener('contextmenu', function(){ event.preventDefault(); }, false);

	// Shortcuts.
	display = document.getElementById('display');
	settings = document.getElementById("settings");
	settingsTimer = document.getElementById('timer-mins');
	settingsTimeout = document.getElementById('timeout-mins');

	ctx = display.getContext('2d');
	ctx.font = '62px Yeseva One';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#FFFFFF';

	// Get central point of the canvas.
	ctxWidth = display.width;
	ctxHeight = display.height;
	xCenter = ctxWidth / 2;
	yCenter = ctxHeight / 2;

	main();
});

function main()
{
	setupPort();
	initTimer();
}

/**
 * Sets up a port that is used to communicate with background process via
 * messages. Also, records the fact of the first run of the extension.
 */
function setupPort()
{
	port = chrome.extension.connect({ name: 'repetitive timer' });
	port.onMessage.addListener(function(msg) {
		if (time = msg.updateTimer)
		{
			updateTimer(time);
		}
	});
}

/**
 * Initializes settings. Takes data from `localStorage` to set default values.
 */
function initSettings()
{
	var timerMinutes = millisecondsToMinutes(localStorage['timer-mins']);
	var timeoutMinutes = millisecondsToMinutes(localStorage['timeout-mins']);

	settingsTimer.value = timerMinutes;
	settingsTimeout.value = timeoutMinutes;
}

/**
 * Initializes timer unless it's running, else just updates the timer indicator
 * with default value.
 */
function initTimer()
{
	if (!timerIsRunning())
	{
		updateTimer(localStorage['timer-mins']);

		// Fucking moronic hack for displaying minutes on the first
		// start of the plugin. Read more here (canvas and custom font
		// load issue):
		// http://lists.w3.org/Archives/Public/www-style/2010Sep/0775.html
		var t = setTimeout(function() {
			updateTimer(localStorage['timer-mins']);
			clearTimeout(t);
		}, 150);
	}
	else
	{
		updateTimer(timeNow());
	}
}

/**
 * @return {Number} current time of the active timer (in milliseconds). If the
 *   timer is inactive returns `undefined` (probably that is bad, though).
 */
function timeNow()
{
	return chrome.extension.getBackgroundPage().timeNow;
}

/**
 * @return {Boolean} whether the timer is currently running
 */
function timerIsRunning()
{
	return chrome.extension.getBackgroundPage().timerIsRunning;
}

/**
 * Updates an indicator (in the popup.html).
 * @param {Number} milliseconds The number of milliseconds, which will be
 *   converted to minutes and used as a new value of the indicator.
 */
function updateTimer(milliseconds)
{
	ctx.clearRect(0, 0, ctxWidth, ctxHeight);
	ctx.fillText(millisecondsToMinutes(milliseconds), xCenter, yCenter);
}

/**
 * The timer dispatcher. Decides whether to stop or start a countdown and sends
 * appropriate message to the background process.
 */
function toggleTimerSwitch()
{
	if (timerIsRunning())
	{
		port.postMessage({ countdownStop: true });
	}
	else
	{
		port.postMessage({ countdownStart: true });
	}
}

/**
 * The dispatcher for settings. Decides whether to show or hide settings menu.
 */
function toggleSettings()
{
	if (settingsAreOpened)
	{
		settingsIntervalId = setInterval(hideSettings, 1);
	}
	else
	{
		initSettings();
		settingsIntervalId = setInterval(showSettings, 1);
	}

	settingsAreOpened = !settingsAreOpened;
}

/**
 * Shows settings menu (it slides from top to bottom).
 */
function showSettings()
{
	settings.style.display = "block";

	if ((old_top = parseFloat(settings.style.top)) < 0)
	{
		settings.style.top = old_top + 5 + "%";
	}
	else
	{
		clearInterval(settingsIntervalId);
	}
}

/**
 * Hides settings menu (it slides from bottom to top).
 */
function hideSettings()
{
	if ((old_top = parseFloat(settings.style.top)) > -100)
	{
		settings.style.top = old_top - 5 + "%";
	}
	else
	{
		settings.style.display = "none";
		clearInterval(settingsIntervalId);
	}
}

/**
 * Saves current user settings defined in the "Settings" slider.
 */
function saveSettings()
{
	var rawTimerMinutes = parseInt(settingsTimer.value);
	var rawTimeoutMinutes = parseInt(settingsTimeout.value);

	var timerMinutes = minutesToMilliseconds(arrangeToRange(rawTimerMinutes));
	var timeoutMinutes = minutesToMilliseconds(arrangeToRange(rawTimeoutMinutes));

	if (!timerIsRunning())
	{
		updateTimer(timerMinutes);
	}

	localStorage['timer-mins'] = timerMinutes;
	localStorage['timeout-mins'] = timeoutMinutes;
}

/**
 * Converts milliseconds to minutes (1000 milliseconds = 1 second).
 * @param {Number} milliseconds
 * @return {Number} Rounded number of minutes in given milliseconds
 */
function millisecondsToMinutes(milliseconds)
{
	return Math.floor(milliseconds / 60000);
}

/**
 * Converts minutes to milliseconds (1 minute = 60000 milliseconds).
 * @param {Number} minutes
 * @return {Number} Milliseconds in minutes
 */
function minutesToMilliseconds(minutes)
{
	return minutes * 60000;
}

/**
 * Validates whether a user types numbers. Anything but a number is rejected.
 */
function validateNumber(event)
{
	var charCode = (event.which) ? event.which : event.keyCode;

	if (charCode > 31 && (charCode < 48 || charCode > 57))
	{
		event.preventDefault();
	}
}

/**
 * Arranges the given number to the interval [1, 1440]. The maximum number is
 * 1440 because a day consists of 1440 minutes, so the timer can ring every
 * 24 hours.
 * @param {Number} number
 * @return {Number} the arranged number
 */
function arrangeToRange(number)
{
	var maxLimit = 1440;
	var minLimit = 1;

	if (number > maxLimit)
	{
		number = maxLimit;
	}
	else if (number < minLimit)
	{
		number = minLimit;
	}

	return number;
}
