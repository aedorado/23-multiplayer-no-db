var WINNUM = 23;
var WAIT = false;
var STARTED = false;
var TURN = false;

var displayNum = 0
var Edisplay = document.getElementById("display-content");
var lbtableRows = document.querySelectorAll("#leaderboard-table tr");
var player;
var username = "";
var rulesString = "2 player turn based game.<br>Each player in his turn pics a number from 1 to 4.<br>The one who reaches 23 is the winner.<br>Click to begin."

function promptUsername() {
	while (username === "") {
	    username = prompt('Enter username');
	}
	if (username == null) {
		location.reload();
	}
}

document.addEventListener('DOMContentLoaded', function() {
	// promptUsername();
	socket.emit('user connected', username);

	socket.on('begin', function (msg) {
		player = msg;
		document.querySelector('#you-are').innerHTML = "You are player " + msg + ".";
		document.querySelector('#game-div').onclick = function() {};
		document.querySelector('#start-div').className = 'invisible';
		document.querySelector('#start-div').style.zIndex = -1;
		document.querySelector('#game-div').className = '';
		document.querySelector('#turn').innerHTML = "TURN : Player 1";
		setTimeout(function() {
			if (player == 1) {
				TURN = true;
			} else {

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

window.onkeypress = function(e) {
	if (STARTED && TURN) {
			if ((e.keyCode >= 48 && e.keyCode <= 52) || (e.keyCode >= 96 && e.keyCode <= 99)) {
				addDisplay(e.charCode - 48);
				var rotatedAlready = document.querySelector("#click-div-" + (e.charCode - 48)).style.transform.substring(7, 11);
				rotatedAlready = (rotatedAlready === "") ? 0 : rotatedAlready;
				if (rotatedAlready != 0) {
					rotatedAlready = (rotatedAlready.charAt(3) == 'd') ? rotatedAlready.substring(0, 3) : rotatedAlready;
				}
				document.querySelector("#click-div-" + (e.charCode - 48)).style.transform = 'rotate(' + (parseInt(rotatedAlready) + 360) + 'deg)';
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
		Edisplay.innerHTML = 23;
		return ;
	}
}


function addDisplay(d) {
	if (STARTED && TURN) {
		if (d + displayNum > 23) {
			alert('Wrong Move.');
			return ;
		}
		displayNum += d;
		socket.emit('move made', { playerNum : player, move : d, total : displayNum });
		TURN = !TURN;
		visualChanges();
		if (displayNum == 23) {
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
		socket.emit('fetch leaderboard');
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