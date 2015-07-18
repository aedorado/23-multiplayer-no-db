var INT_MAX = 99999999
var WINNUM = INT_MAX;
var WAIT = false;
var STARTED = false;
var TURN = false;
var randomNumGlobal = [23, 1, 2, 3, 4];

var displayNum = 0
var Edisplay = document.getElementById("display-content");
var lbtableRows = document.querySelectorAll("#leaderboard-table tr");
var player;
var username = "";
var rulesString = "2 player turn based game.<br>Each player in his turn pics a number given @ the bottom to add to the total.<br>The one who reaches the target is the winner.<br>"

function promptUsername() {
	while (username === "") {
	    username = prompt('Enter username');
	}
	if (username == null) {
		location.reload();
	}
}

function firstTimers(playerNum, randomNum) {
	randomNumGlobal = randomNum;
	WINNUM = randomNum[0];
	player = playerNum;

	document.querySelector('#target').innerHTML = "Your target is " + WINNUM + ".";
	document.querySelector('#you-are').innerHTML = "You are player " + playerNum + ".";
	var clickDivContent = document.querySelectorAll('.click-div .content');
	for (i = 1; i < 5; i++) {
		clickDivContent[i - 1].innerHTML = randomNum[i];
	}
}

document.addEventListener('DOMContentLoaded', function() {
	// promptUsername();
	socket.emit('user connected', username);

	socket.on('begin', function (playerNum, randomNum) {
		if (WINNUM == INT_MAX) {
			firstTimers(playerNum, randomNum);
		}
		document.querySelector('#game-div').onclick = function() {};
		document.querySelector('#start-div').className = 'invisible';
		document.querySelector('#start-div').style.zIndex = -1;
		document.querySelector('#game-div').className = '';
		document.querySelector('#turn').innerHTML = "TURN : Player 1";
		setTimeout(function() {
			if (player == 1) {
				TURN = true;
			}
		}, 1000);
		STARTED = true;
	});

	socket.on('give turn', function(msg) {
		displayNum += parseInt(msg);
		visualChanges();
		TURN = true;
		if (TURN) {
			document.querySelector('#turn').innerHTML = "TURN : Player " + player;
		} else {
			document.querySelector('#turn').innerHTML = "TURN : Player " + (3 - player);
		}
	});

	socket.on('winner', function(msg) {
		console.log(msg);
		document.querySelector('#win-' + msg).className = 'win';
		document.querySelector('#win-' + (3 - msg)).className = 'win invisible';
		reset();
	});

	socket.on('opp disconnected', function() {
		alert('Your opponent disconnected.');
		location.reload();
	});

}, false);

window.onresize = window.onload = function() {
	for (var i = 1; i <= 4; i++) {
		var element = document.querySelector('#click-div-' + i);
		element.style.height = element.scrollWidth;
	}
	var element = document.querySelector('#title');
	element.style.height = element.scrollWidth;
}

document.querySelector('#start-button').onclick = function() {
	socket.emit('begin');
	document.querySelector('#loading-img-div').className = "content";
	document.querySelector('#title-number').className += " invisible";
	document.querySelector('#rules').innerHTML = "Finding an opponent";
}

function mapKeyValid(c) {
	switch (c) {
		case randomNumGlobal[1]: return 1;
		case randomNumGlobal[2]: return 2;
		case randomNumGlobal[3]: return 3;
		case randomNumGlobal[4]: return 4;
		default : return 0;
	}
}

window.onkeypress = function(e) {
	if (STARTED && TURN) {
			if ((e.keyCode >= 49 && e.keyCode <= 56) || (e.keyCode >= 96 && e.keyCode <= 103)) {
				var validAddendum = mapKeyValid(e.keyCode - 48);
				if (validAddendum != 0) {
					addDisplay(validAddendum);
					var rotatedAlready = document.querySelector("#click-div-" + (validAddendum)).style.transform.substring(7, 11);
					rotatedAlready = (rotatedAlready === "") ? 0 : rotatedAlready;
					if (rotatedAlready != 0) {
						rotatedAlready = (rotatedAlready.charAt(3) == 'd') ? rotatedAlready.substring(0, 3) : rotatedAlready;
					}
					document.querySelector("#click-div-" + validAddendum).style.transform = 'rotate(' + (parseInt(rotatedAlready) + 360) + 'deg)';
				}
			}
	}
}

function visualChanges() {
	Edisplay.className = 'invisible';
	setTimeout(function() {
		Edisplay.innerHTML = displayNum;
		Edisplay.className = '';
	}, 300);

	if (TURN) {
		document.querySelector('#turn').innerHTML = "TURN : Player " + player;
	} else {
		document.querySelector('#turn').innerHTML = "TURN : Player " + (3 - player);
	}

	if (displayNum == WINNUM) {		
		document.querySelector('#win-' + player).className = "win ";
		Edisplay.innerHTML = WINNUM;
		return ;
	}
}


function addDisplay(i) {
	if (STARTED && TURN) {
		// alert(typeof d);
		if (randomNumGlobal[i] + displayNum > WINNUM) {
			alert('Wrong Move.');
			return ;
		}
		displayNum += randomNumGlobal[i];
		socket.emit('move made', { playerNum : player, move : randomNumGlobal[i], total : displayNum });
		TURN = !TURN;
		visualChanges();
		if (displayNum == WINNUM) {
			document.querySelector('#win-' + player).className = 'win';
			reset();
		}
	}
}

function reset() {
	function visual() {
		document.querySelector('#rules').innerHTML = rulesString;
		var clickDiv = document.getElementsByClassName('click-div');
		for (var i = 0; i < clickDiv.length; i++) {
			clickDiv[i].style.transform = '';
		}

	}
	STARTED = false;
	displayNum = 0;
	visual();
	document.querySelector('#game-div').onclick = function() {
		Edisplay.innerHTML = 0;
		this.className = 'invisible';
		document.querySelector('#win-1').className = 'win invisible';
		document.querySelector('#win-2').className = 'win invisible';
		document.querySelector('#start-div').style.zIndex = 10;
		document.querySelector('#start-div').className = '';
		document.querySelector('#title-number').className = 'content';
		document.querySelector('#loading-img-div').className += ' invisible';
	}
}