// Used by a countdown and represends current time, if a timer is
// active. I expose it because I need to know this information in my
// `popup.html`.
var timeNow;

// Represents the state of the coundown.
var timerIsRunning = false;


chrome.extension.onConnect.addListener(function(port) {
	console.assert(port.name == 'repetitive timer');

	port.onMessage.addListener(function(msg){
		if (msg.setup)
		{
			port.postMessage({ firstRun: false });
		}
		else if (msg.countdownStop)
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
	var timeout = true;

	// Change timer state.
	timerIsRunning = true;

	timerIntervalId = setInterval(function() {
		timeNow = initTime - (new Date().getTime() - startTime);

		if (timeNow <= 0)
		{
			startTime = new Date().getTime();

			if (timeout)
			{
				initTime = localStorage['timeout-mins'];
				playSound('timeout.ogg');
			}
			else
			{
				initTime = localStorage['timer-mins'];
				playSound('timer.ogg');
			}

			timeout = !timeout;
		}
		else
		{
			callUpdateTimer(port, timeNow);
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
 * Sends a message to `popup.js` with time argument. The reciever (popup.js)
 * should call `updateTimer` function after that.
 * @param {PortImpl} port The port, which should be used for sending messages
 * @param {Number} time The time to be updated in popup.html
 */
function callUpdateTimer(port, time)
{
	port.postMessage({ updateTimer: time });
}
