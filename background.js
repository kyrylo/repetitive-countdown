// Used by a countdown and represends current time, if a timer is active. I
// expose it because I need to know this information in my `popup.html`.
var timeNow;

// Represents the state of the coundown.
var timerIsRunning = false;

var timeout;
var popup_window;

var initTopGradient = 5;
var initBottomGradient = 17;

var currentTopGradient = initTopGradient;
var currentBottomGradient = initBottomGradient;
var gradientStep = 1.18;

chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == 'repetitive countdown');

	port.onMessage.addListener(function(msg) {
		if (msg.countdownStop)
		{
			countdownStop();
			port.postMessage({ updateTimer: localStorage['timer-mins'] });
		}
		else if (msg.countdownStart)
		{
			countdownStart();
		}

		if (popup_window = msg.updateGradients)
		{
			updateGradients(getPopup(), currentTopGradient, currentBottomGradient);
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
 */
function countdownStart()
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
		popup_window = getPopup();

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

			if (popup_window) {
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

				popup_window.updateLedLights({
					ledTimer: ledTimer,
					ledTimeout: ledTimeout
				});
			}
			timeout = !timeout;
		}
		else
		{
			if (((Math.floor(millisecondsToSeconds(timeNow)) % 60) == 0))
			{
				resetGradients();
			}
			else
			{
				currentTopGradient += gradientStep;
				currentBottomGradient += gradientStep;
			}

			if (popup_window) {
				popup_window.updateTimer(timeNow);
				updateGradients(popup_window, currentTopGradient, currentBottomGradient);
			}
		}
	}, 1000);
}

/**
 * Stops the countdown loop by using `timerIntervalId` handle.
 */
function countdownStop()
{
	timerIsRunning = false;
	clearInterval(timerIntervalId);
	popup_window = getPopup()
	if (popup_window)
	{
		resetGradients();
		updateGradients(popup_window, currentTopGradient, currentBottomGradient);
	}
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
 * Converts milliseconds to seconds (1 second = 1000 milliseconds).
 * @param {Number} milliseconds
 * @return {Number} Seconds in milliseconds
 */
function millisecondsToSeconds(milliseconds)
{
	return milliseconds / 1000;
}

/**
 * Resets current gradients to default values.
 */
function resetGradients()
{
	currentTopGradient = initTopGradient;
	currentBottomGradient = initBottomGradient;
}

function updateGradients(window, topGradient, bottomGradient)
{
	window.display.style.background = "url('images/display-bg-alpha.png'), -webkit-linear-gradient(top, #FFFFFF " + topGradient + "%, #2A80A8 " + bottomGradient + "%)";
}

function getPopup()
{
	return chrome.extension.getViews({"type":"popup"})[0]
}
