document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#settings-btn').addEventListener('click', toggleSettings);
	document.querySelector('#timer-btn').addEventListener('click', toggleTimerSwitch);
	document.querySelector('#timer-mins').addEventListener('keypress', function(){ validateNumber(event); }, false);
	document.querySelector('#timeout-mins').addEventListener('keypress', function(){ validateNumber(event); }, false);
	document.querySelector('#save-settings').addEventListener('click', saveSettings);
	document.querySelector('body').addEventListener('contextmenu', function(){ event.preventDefault(); }, false);

	main();
});

/**
 * Sets default parameters.
 */
function main()
{
	settingsAreOpened = false;
	timerIsRunning = false;

	localStorage['timer-mins'] = localStorage['timer-mins'] || 0;
	localStorage['timeout-mins'] = localStorage["timeout-mins"] || 0;

	sound = document.getElementById('timer-sound');
	minutes = document.getElementById('minutes');
	settings = document.getElementById("settings");
	settingsTimer = document.getElementById('timer-mins');
	settingsTimeout = document.getElementById('timeout-mins');

	updateSettings();
	updateTimer(localStorage['timer-mins']);
}

function updateTimer(milliseconds)
{
	var mins = millisecondsToMinutes(milliseconds);
	minutes.innerHTML = mins;
}

function updateSettings()
{
	var timerMinutes = millisecondsToMinutes(localStorage['timer-mins']);
	var timeoutMinutes = millisecondsToMinutes(localStorage['timeout-mins']);

	settingsTimer.value = timerMinutes;
	settingsTimeout.value = timeoutMinutes;
}

function toggleTimerSwitch()
{
	if (timerIsRunning)
	{
		countdownStop();
	}
	else
	{
		countdownStart();
	}

	timerIsRunning = !timerIsRunning;
}

/**
 * The dispatcher for settings. Decides whether to show or hide settings menu.
 */
function toggleSettings()
{
	if (settingsAreOpened)
	{
		settingsIntervalId = setInterval(function(){ hideSettings(); }, 1);
	}
	else
	{
		settingsIntervalId = setInterval(function(){ showSettings(); }, 1);
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
 * Starts an endless countdown loop. After the first countdown (main one) it
 * will launch another countdown, which is a timeout. And then all over again.
 * Yields timerIntervalId, which can be used for the countdown stoppage.
 */
function countdownStart()
{
	var initTime = localStorage['timer-mins'];
	var startTime = new Date().getTime();
	var timeout = true;

	timerIntervalId = setInterval(function(){
		var timeNow = initTime - (new Date().getTime() - startTime);

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
			updateTimer(timeNow);
		}
	}, 1000);
}

/**
 * Stops the countdown loop.
 */
function countdownStop()
{
	clearInterval(timerIntervalId);
	minutes.innerHTML = millisecondsToMinutes(localStorage['timer-mins']);
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
 * Saves current user settings defined in the "Settings" slider.
 */
function saveSettings()
{
	var rawTimerMinutes = parseInt(settingsTimer.value);
	var rawTimeoutMinutes = parseInt(settingsTimeout.value);

	var timerMinutes = minutesToMilliseconds(arrangeToRange(rawTimerMinutes));
	var timeoutMinutes = minutesToMilliseconds(arrangeToRange(rawTimeoutMinutes));

	localStorage['timer-mins'] = timerMinutes;
	localStorage['timeout-mins'] = timeoutMinutes;
}

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
