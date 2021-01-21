var curLevel = 0;
var curGame;
var curSettingsTheme = "PushPush.dhtml";
var curSettingsMaxLevel = 0;
var curSettingsSize = "3";
var curBests = new Array();

// 4096
//-  57 
//-   3
// ----
// 4036 

var styleSheetRuleBoardSize;
var timerUpdateTime;

function Init() {
	var newMaxLevel, newTheme;

	localforage.getItem("MaxLevel").then(function (value) {
        if (value !== null) curLevel = curSettingsMaxLevel = parseInt(value);
    });
	
	localforage.getItem("Theme").then(function (value) {
        if (value !== null) {
            ChangeImgsSrc(divHelpDialog, curSettingsTheme, value);
            ChangeImgsSrc(divAboutDialog, curSettingsTheme, value);
            curSettingsTheme = value;
        }
    });

    styleSheetRuleBoardSize = document.styleSheets["styleDynamic"].rules[0];
	localforage.getItem("Size").then(function (value) {
        if (value !== null) {
            styleSheetRuleBoardSize.style.width = (parseFloat(value) *10) +"px";
            styleSheetRuleBoardSize.style.height = (parseFloat(value) *10) +"px";
            curSettingsSize = value;
        }
    });
	
	localforage.getItem("Bests").then(function (value) {
        if (value !== null) {
            curBests = value;
        } 
        else {
            curBests = [];
        }
    });

	setTimeout("InitPhase2()", 100);
}

function InitPhase2() {
    divStatus.style.display = "initial";
	divLoadingMsg.remove();
	curGame = new PushPushGame(LevelData[curLevel], divBoardContainer);
	curGame.start(GameOnKeyDown, GameWon, MoveCountChanged);
	spanStatusLevel.innerText = curGame.level[0];
	if (curBests[curLevel] && curBests[curLevel].length == 2) {
		tdStatusBest.style.display = tdStatusBest2.style.display = "";
		spanStatusBestMoves.innerText = curBests[curLevel][0];
		spanStatusBestTime.innerText = formatTime(curBests[curLevel][1]);
	} else
		tdStatusBest.style.display = tdStatusBest2.style.display = "none";
	timerUpdateTime = setInterval("TimerTick();", 1000);
}

function formatTime(iTimeInSecs) {
	var sFormattedTime = "";
	if (Math.floor(iTimeInSecs / 3600) > 0) sFormattedTime += Math.floor(iTimeInSecs / 3600) + ":";
	if ( (Math.floor((iTimeInSecs % 3600) / 60) < 10) && (sFormattedTime.length > 0) ) sFormattedTime += "0";
	sFormattedTime += Math.floor((iTimeInSecs % 3600) / 60) + ":";
	if (iTimeInSecs % 60 < 10) sFormattedTime += "0";
	sFormattedTime += iTimeInSecs % 60;
	return sFormattedTime;
}

function GameWon() {
	clearInterval(timerUpdateTime);
	spanCongratsMoveCount.innerText = curGame.moveCount;
    var curTime = curGame.UpdateTimer();
	spanCongratsTime.innerText = formatTime(curTime);
	spanCongratsExtraMsg.innerHTML = "";
	if (
        curLevel >= curBests.length
		|| curGame.moveCount < curBests[curLevel][0]
		|| curGame.moveCount == curBests[curLevel][0] && curTime < curBests[curLevel][1]
    ) {
		spanCongratsExtraMsg.innerHTML = "<BR><I>You have set a new record!!</I><BR>";
		curBests[curLevel] = Array(curGame.moveCount, curTime);
		localforage.setItem("Bests", curBests);
	} 
	if (++curLevel >= LevelData.length) {
		curLevel = 0;
		spanCongratsExtraMsg.innerHTML += "<BR><B>You've completed every level!! Way to go!!</B>";
	}
	if (curLevel > curSettingsMaxLevel) {
		curSettingsMaxLevel = curLevel;
		localforage.setItem("MaxLevel", curSettingsMaxLevel);
	}
	setTimeout("dialogBoxShow(divCongratsDialog, menuResetBtn);", 500);
}

function GetLevelsBack() {
	if (curSettingsMaxLevel >= LevelData.length - 1) {
		alert("You already have access to all "+ LevelData.length +" levels!");
		return;
	}
	var iNewLevel = -1;
	while (iNewLevel == -1) {
		iNewLevel = prompt("Enter the level jump to ("+ (curSettingsMaxLevel + 2) +" - "+ LevelData.length +"):", 1);
		if (iNewLevel == null) return;
        iNewLevel = parseInt(iNewLevel, 10);
        if (isNaN(iNewLevel) || iNewLevel < curSettingsMaxLevel + 1 || iNewLevel > LevelData.length + 1) {
            alert("Sorry, you entered and invalid level. Try again.");
            iNewLevel = -1;
            continue;
        }
        curLevel = iNewLevel - 1;
        curSettingsMaxLevel = curLevel;
        localforage.setItem("MaxLevel", curSettingsMaxLevel);
        dialogBoxHide();
        menuResetBtn();
		return;
	}
}

function MoveCountChanged() {
	spanStatusMoveCount.innerText = curGame.moveCount;
}

function TimerTick() {
	spanStatusTime.innerText = formatTime(curGame.UpdateTimer());
}

function menuUndoBtn() {
	curGame.undoLastMove();
}

function menuResetBtn() {
	curGame.destroy();
	clearInterval(timerUpdateTime);
	curGame = new PushPushGame(LevelData[curLevel], curGame.parentElmt);
	curGame.start(GameOnKeyDown, GameWon, MoveCountChanged);
	timerUpdateTime = setInterval("TimerTick();", 1000);
	spanStatusLevel.innerText = curGame.level[0];
	if (curBests[curLevel] && curBests[curLevel].length == 2) {
		tdStatusBest.style.display = tdStatusBest2.style.display = "";
		spanStatusBestMoves.innerText = curBests[curLevel][0];
		spanStatusBestTime.innerText = formatTime(curBests[curLevel][1]);
	} else
		tdStatusBest.style.display = tdStatusBest2.style.display = "none";
	spanStatusMoveCount.innerText = curGame.moveCount;
	spanStatusTime.innerText = formatTime(curGame.UpdateTimer());
}

function menuSelectLevelBtn() {
	var newOption;
	if (selLevels.length != curSettingsMaxLevel +1) selLevels.length = 0;
	if (selLevels.length == 0) {
		for (var i=0; i < curSettingsMaxLevel+1; i++) {
			selLevels.appendChild(newOption = document.createElement("OPTION"));
			newOption.innerText = LevelData[i][0] +"  ";
			newOption.value = i;
		}
		selLevels.onchange = function (){
			var tempGame = new PushPushGame(LevelData[selLevels.value], tdLevelSelectPreview);
			tempGame.boardElmt.className = "clsGameBoardPreview";
		};
		selLevels.ondblclick = dialogLevelSelectPlayBtn;
	}
	selLevels.value = curLevel;
	selLevels.onchange();
	dialogBoxShow(divLevelSelectDialog);
}

function dialogLevelSelectPlayBtn() {
	dialogBoxHide();
	curLevel = selLevels.value;
	menuResetBtn();
}

function menuBestsBtn() {
	while (tblBests.rows.length > 1) tblBests.deleteRow(tblBests.rows.length-1);
	for (var i=0; i <= curSettingsMaxLevel; i++) {
		var newRow = tblBests.insertRow();
		var newCell = newRow.insertCell();
		newCell.innerText = LevelData[i][0];

		newCell = newRow.insertCell();
		var newCell2 = newRow.insertCell();
		
		if (curBests[i] && curBests[i].length == 2) {
			newCell.innerText = curBests[i][0];
			newCell2.innerText = formatTime(curBests[i][1]);
		} else {
			newCell.innerText = "- - -";
			newCell2.innerText = "- - -";
		}
	}
	dialogBoxShow(divBestsDialog);
}

function menuOptionsBtn() {
	dialogBoxShow(divOptionsDialog);
	selOptionsSize.value = curSettingsSize;
	selOptionsTheme.value = curSettingsTheme;
	selOptionsThemeOnChange();
}

function dialogOptionsApplyBtn() {
	dialogBoxHide();
	if (curSettingsTheme != selOptionsTheme.value) {
		ChangeImgsSrc(divBoardContainer, curSettingsTheme, selOptionsTheme.value);
		ChangeImgsSrc(divHelpDialog, curSettingsTheme, selOptionsTheme.value);
		ChangeImgsSrc(divAboutDialog, curSettingsTheme, selOptionsTheme.value);
		curSettingsTheme = selOptionsTheme.value;
		localforage.setItem("Theme", curSettingsTheme);
	}
	if (curSettingsSize != selOptionsSize.value) {
		curSettingsSize = selOptionsSize.value;
		localforage.setItem("Size", curSettingsSize);
		styleSheetRuleBoardSize.style.width = (parseFloat(curSettingsSize) *10) +"px";
		styleSheetRuleBoardSize.style.height = (parseFloat(curSettingsSize) *10) +"px";
	}
}

function ChangeImgsSrc(elmt, sSearchTxt, sReplaceTxt) {
	var imgs = elmt.getElementsByTagName("IMG");
	for (var i=0; i < imgs.length; i++) {
		//imgs[i].src = imgs[i].src.replace(sSearchTxt, sReplaceTxt);
		var newImg = imgs[i].cloneNode();
		newImg.src = imgs[i].src.replace(sSearchTxt, sReplaceTxt);
		imgs[i].replaceWith(newImg);
	}
}

function selOptionsThemeOnChange() {
	var aLinks = {
		"PushPush.dhtml": Array("Theme &copy; by Sam Benedict", "."),
		"SCH-T300": Array("Theme &copy; by Samsung", "http://www.samsungmobile.com/"),
		"how.to.pushpush": Array("Theme &copy; by Namster", "http://how.to/PushPush"),
		"www.cs.ualberta.ca": Array("Theme &copy; by University of Alberta's Computer Science department", "http://www.cs.ualberta.ca/~games/Sokoban/"),
		"pimpernel": Array("Theme &copy; Pimpernel Online", "http://www.pimpernel.com/sokoban")
	};
		
	aOptionsThemeInfo.innerHTML = aLinks[selOptionsTheme.value][0] + "<br>(click for homepage)";
	aOptionsThemeInfo.href = aLinks[selOptionsTheme.value][1];
}

function menuHelpBtn() {
	dialogBoxShow(divHelpDialog);
}

function menuAboutBtn() {
	//alert("©2002 by Samuel M. Benedict");
	dialogBoxShow(divAboutDialog);
}

function GameOnKeyDown() {
	switch (event.keyCode) {
		case 19: //pause
			break;
		case 37: //left
			curGame.Move(-1,0)
			break;
		case 38: //up
			curGame.Move(0,-1)
			break;
		case 39: //right
			curGame.Move(1,0)
			break;
		case 40: //down
			curGame.Move(0,1)
			break;
		case 90: //Z
			menuUndoBtn();
			break;
		case 85: //U
			menuUndoBtn();
			break;
		case 82: //R
			menuResetBtn();
			break;
		case 76: //L
			menuSelectLevelBtn();
			break;
		case 66: //B
			menuBestsBtn();
			break;
		case 79: //O
			menuOptionsBtn();
			break;
		case 72: //H
			menuHelpBtn();
			break;
		case 65: //A
			menuAboutBtn();
			break;
		default:
			//if (event.ctrlKey) status = "-"+ event.keyCode;
			return true;
	}
	event.cancelBubble = true;
	event.returnValue = false;
	return false;
};

var dialogCurrentContentDiv = null;
var dialogCloseHandler = null;

function dialogBoxShow(divDialogContent, onCloseHandler) {
    dialogCurrentContentDiv = divDialogContent;
    spanDialogTitleText.innerText = divDialogContent.firstElementChild.textContent
    divDialogBody.appendChild(divDialogContent.lastElementChild);
    divDialogFrame.style.display = "block";
    divDialogCover.style.display = "block";
    divDialogFrame.style.marginTop = -(divDialogFrame.offsetHeight /2) + "px";
    
    if (onCloseHandler) dialogCloseHandler = onCloseHandler;
    if (curGame) {
        curGame.Pause();
        clearInterval(timerUpdateTime);
    }
}

function dialogBoxHide() {
    spanDialogTitleText.innerText = null;
    dialogCurrentContentDiv.appendChild(divDialogBody.firstElementChild);
    divDialogFrame.style.display = "none";
    divDialogCover.style.display = "none";
    
    if (curGame) {
        curGame.Unpause();
        timerUpdateTime = setInterval("TimerTick();", 1000);
    }
}

function dialogBoxCloseBtn() {
	dialogBoxHide();
	if (dialogCloseHandler) {
		var closeHandler = dialogCloseHandler;
		dialogCloseHandler = null;
		closeHandler();
	}
}
