// Used by a countdown and represends current time, if a timer is active. I
// expose it because I need to know this information in my `popup.html`.
var timeNow;

// Represents the state of the coundown.
var timerIsRunning = false;

var timeout;

chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == 'repetitive countdown');

	port.onMessage.addListener(function(msg) {
		if (msg.countdownStop)
		{
			countdownStop(port);
		}
		else if (msg.countdownStart)
		{
			countdownStart(port);
		}
	});
});

document.addEventListener('DOMContentLoaded', function() {
	sound = document.getElementById('timer-sound');
});

/**
 * Starts an endless countdown loop. After the first countdown (main one) it
 * will launch another countdown, which is a timeout. And then all over again.
 * Yields timerIntervalId, which can be used for the countdown stoppage.
 * @param {PortImpl} port The port, which should be used for sending messages
 */
function countdownStart(port)
{
	// The main countdown.
	var initTime = localStorage['timer-mins'];

	// When a timer has been launched.
	var startTime = new Date().getTime();

	// After the main countdown invoke the timeout stage.
	timeout = true;

	// Change timer state.
	timerIsRunning = true;

	timerIntervalId = setInterval(function() {
		timeNow = initTime - (new Date().getTime() - startTime);
		var popup_window = chrome.extension.getViews({"type":"popup"})[0]

		if (timeNow <= 0)
		{
			startTime = new Date().getTime();

			if (timeout)
			{
				initTime = localStorage['timeout-mins'];
				playSound('timeout.wav');
			}
			else
			{
				initTime = localStorage['timer-mins'];
				playSound('timer.wav');
			}

			if (popup_window) { callUpdateLedLights(popup_window, timeout); }
			timeout = !timeout;
		}
		else
		{
			if (popup_window) { callUpdateTimer(popup_window, timeNow); }
		}
	}, 1000);
}

/**
 * Stops the countdown loop by using `timerIntervalId` handle.
 * @param {PortImpl} port The port, which should be used for sending messages
 */
function countdownStop(port)
{
	timerIsRunning = false;
	clearInterval(timerIntervalId);
	callUpdateTimer(port, localStorage['timer-mins']);
}

/**
 * Sets a sound from path to sound object and plays it.
 * @param {String} path The path to the sound to be played
 */
function playSound(path)
{
	sound.src = 'sounds/' + path;
	sound.play();
}

/**
 * Updates `popup.html` with new value of the countdown.
 * @param {Window} popup_window The popup window
 * @param {Number} time The time to be updated in popup.html
 */
function callUpdateTimer(popup_window, time)
{
	popup_window.updateTimer(time);
}

/**
 * Updates led lights.
 * @param {Window} popup_window The popup window
 * @param {Number} timeout Whether it's timeout
 */
function callUpdateLedLights(popup_window, timeout)
{
	var ledTimer;
	var ledTimeout;

	if (timeout)
	{
		ledTimer = false;
		ledTimeout = true;
	}
	else
	{
		ledTimer = true;
		ledTimeout = false;
	}

	popup_window.updateLedLights({ledTimer: ledTimer, ledTimeout: ledTimeout});
}
