function PushPushGame(aLevel, targetElmt) {
	this.level = aLevel;
	this.state = aLevel[4];
	this.moveCount = 0;
	this.undoHistory = Array();
	this.parentElmt = targetElmt;
	this.boardElmt = this.CreateGameBoard();
	if (targetElmt)
		if (targetElmt.firstChild) targetElmt.firstChild.replaceWith(this.boardElmt)
		else targetElmt.appendChild(this.boardElmt);

	this.curPos = Array(0,0);
	var iPos = this.state.indexOf("S");
	this.curPos[1] = (iPos - ( this.curPos[0] = iPos % this.level[2] )) / this.level[2]

	this.onKeyDown = null;
	this.inProgress = false;
	this.onWin = null;
	this.onMovesInc = null;
	this.onTimerTick = null;
	this.elapsedTime = 0;
	this.lastTime = null;
}
PushPushGame.prototype.start = function(keyDownHandler, winHandler, movesHandler, timerTickHandler) {
	this.inProgress = true;
	this.setKeyDownHandler(keyDownHandler);
	this.onWin = winHandler;
	if (movesHandler) this.onMovesInc = movesHandler;
	//if (timerTickHandler) this.onTimerTick = timerTickHandler;
	this.lastTime = new Date();
	//this.Timer = setInterval(this.doTimerTick, 1000);
}
PushPushGame.prototype.UpdateTimer = function () {
	if (this.inProgress) {
		var newTime = new Date();
		var timeDiff =  -this.lastTime.getTime()+ newTime.getTime();
		this.lastTime = newTime;
		this.elapsedTime += timeDiff / 1000;
	}
	//if (this.onTimerTick) this.onTimerTick(this.elapsedTime);
	return Math.round(this.elapsedTime);
}
PushPushGame.prototype.Pause = function() {
	//clearInterval(this.Timer);
	this.UpdateTimer();
	this.inProgress = false;
	if (this.onKeyDown)
		document.body.removeEventListener("keydown", this.onKeyDown);
}
PushPushGame.prototype.Unpause = function() {
	this.lastTime = new Date();
	this.inProgress = true;
	//this.Timer = setInterval(this.doTimerTick, 1000);
	if (this.onKeyDown)
		document.body.addEventListener("keydown", this.onKeyDown);
}
PushPushGame.prototype.destroy = function() {
	//this.boardElmt.removeNode(true)
	//clearInterval(this.Timer);
	this.UpdateTimer();
	this.inProgress = false;
	if (this.onKeyDown)
		document.body.removeEventListener("keydown", this.onKeyDown);
	this.onKeyDown = null;
	this.onMovesInc = null;
}
PushPushGame.prototype.setKeyDownHandler = function(handler) {
	if (this.onKeyDown)
		document.body.removeEventListener("keydown", this.onKeyDown);
	this.onKeyDown = handler;
	if (this.inProgress)
		document.body.addEventListener("keydown", this.onKeyDown);
}
PushPushGame.prototype.anyGoalsLeft = function() {
	return (this.state.indexOf("O") > -1);
}
PushPushGame.prototype.atPos = function(arrPos) {
	return this.level[4].substr(arrPos[1]*this.level[2] + arrPos[0], 1);
}
PushPushGame.prototype.atPosNow = function(arrPos) {
	return this.state.substr(arrPos[1]*this.level[2] + arrPos[0], 1);
}
PushPushGame.prototype.setPosNow = function(arrPos, strVal) {
	this.state =
		this.state.substr(0, arrPos[1]*this.level[2] + arrPos[0])
		+ strVal
		+ this.state.substr(arrPos[1]*this.level[2] + arrPos[0] +1);
}
PushPushGame.prototype.atBoardPos = function(arrPos) {
	return this.boardElmt.rows[arrPos[1]].cells[arrPos[0]];
}

PushPushGame.prototype.CreateGameBoard = function() {
	var boardArr = this.level;
	var tblGameBoard = document.createElement("TABLE");
	tblGameBoard.className = "clsGameBoard";
	tblGameBoard.cellPadding="0";
	tblGameBoard.cellSpacing="0";
	
	for (var j=0; j < boardArr[3]; j++) {
		var trNew = tblGameBoard.insertRow();
		for (var i=0; i < boardArr[2]; i++) {
			var tdNew = trNew.insertCell();
			tdNew.style.position = "relative";
			tdNew.style.top = "0px";
			
			var imgNew = document.createElement("IMG");
			if (this.state.substr(j*boardArr[2] + i,1) == "S") {
				imgNew.src = "images/"+ curSettingsTheme +"/Cursor.gif";
				imgNew.style.position = "absolute";
				imgNew.style.top = "0px";
				tdNew.appendChild(imgNew);
				imgNew = document.createElement("IMG");
			}
			if (this.state.substr(j*boardArr[2] + i,1) == "O") {
				imgNew.src = "images/"+ curSettingsTheme +"/Rock.gif";
				imgNew.style.position = "absolute";
				imgNew.style.top = "0px";
				tdNew.appendChild(imgNew);
				imgNew = document.createElement("IMG");
			}
			if (this.state.substr(j*boardArr[2] + i,1) == "D") {
				imgNew.src = "images/"+ curSettingsTheme +"/GoalOccupied.gif";
				imgNew.style.position = "absolute";
				imgNew.style.top = "0px";
				tdNew.appendChild(imgNew);
				imgNew = document.createElement("IMG");
			}
			switch (this.state.substr(j*boardArr[2] + i,1)) {
				case "X":
					imgNew.src = "images/"+ curSettingsTheme +"/Wall.gif";
					break;
				case "H":
				case "D":
					imgNew.src = "images/"+ curSettingsTheme +"/Goal.gif";
					break;
				case "-":
					imgNew.src = "images/"+ curSettingsTheme +"/Outside.gif";
					break;
				case " ":
				case "O":
				case "S":
					imgNew.src = "images/"+ curSettingsTheme +"/Floor.gif";
					break;
			}
			tdNew.appendChild(imgNew);
		}
	}
	return tblGameBoard;
}

PushPushGame.prototype.Move = function(xDir, yDir) {
	var newPos = Array(this.curPos[0]+xDir, this.curPos[1]+yDir);

	if ( (newPos[0] < 0)
		|| (newPos[0] >= this.level[2])
		) return;
	if ( (newPos[1] < 0)
		|| (newPos[1] >= this.level[3])
		) return;

	var historyEntry = Array(this.curPos, newPos);
	var rockNewPos;
	
	switch (this.atPosNow(newPos)) {
		case "O":
		case "D":
			if (! this.tryMoveRock( newPos, rockNewPos = Array( newPos[0]+xDir, newPos[1]+yDir ) ) ) return;
			historyEntry[2] = rockNewPos;
		case " ":
		case "S":
		case "H":
			this.atBoardPos(newPos).insertAdjacentElement("afterbegin", this.atBoardPos(this.curPos).firstChild);
			this.curPos = newPos;
			break;
		default:
			return;
	}
	++this.moveCount;
	if (this.onMovesInc) this.onMovesInc();
	this.undoHistory[this.undoHistory.length] = historyEntry;
	if (!this.anyGoalsLeft()) {
		this.destroy();
		if (this.onWin) this.onWin();
	}
}
PushPushGame.prototype.tryMoveRock = function(rockPos, newPos) {
	var newImg;
	switch (this.atPosNow(newPos)) {
		case " ":
		case "S":
			this.setPosNow(newPos, "O");
			newImg = this.atBoardPos(rockPos).firstChild;
            newImg.remove();
			newImg.src = "images/"+ curSettingsTheme +"/Rock.gif";
			this.atBoardPos(newPos).insertAdjacentElement("afterbegin", newImg);
			break;
		case "H":
			this.setPosNow(newPos, "D");
			newImg = this.atBoardPos(rockPos).firstChild;
            newImg.remove();
			newImg.src = "images/"+ curSettingsTheme +"/GoalOccupied.gif";
			this.atBoardPos(newPos).insertAdjacentElement("afterbegin", newImg);
			break;
		default:
			return false;
	}
	switch (this.atPosNow(rockPos)) {
		case "D":
			this.setPosNow(rockPos, "H")
			break;
		case "O":
			this.setPosNow(rockPos, " ")
			break;
	}
	return true;
}
PushPushGame.prototype.undoLastMove = function() {
	if (this.undoHistory.length > 0) {
		var historyEntry = this.undoHistory[this.undoHistory.length-1];
		--this.undoHistory.length;
		var newPos = historyEntry[0];

        var el = this.atBoardPos(this.curPos).firstChild;
        el.remove();
		this.atBoardPos(newPos).insertAdjacentElement("afterbegin", el);
		this.curPos = newPos;

		if (historyEntry.length == 3) this.tryMoveRock(historyEntry[2], historyEntry[1]);
	}
}