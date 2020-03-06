/*
  Code modified from:
  http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/
  using graphics purchased from vectorstock.com
*/

/* Initialization.
Here, we create and add our "canvas" to the page.
We also load all of our images. 
*/


let canvas;
let ctx;

// canvas = document.createElement("canvas");
canvas = document.getElementById('mycanvas');
ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
// document.body.appendChild(canvas);

let bgReady, heroReady, monsterReady;
let bgImage, heroImage, monsterImage;

let startTime = Date.now();
const SECONDS_PER_ROUND = 6;
let elapsedTime = 0;
let score = 0;
let gameFinished = false;
let timeLeft;
let currRound = 1;
let high_score = 0;
const historyScoresArray = [];
let gameState = {};
let currUser = 'anonymous'; 

const nameInputBox = document.getElementById('nameInputBox');
const submitNameButton = document.getElementById('submitNameButton');
const scoreDisplay = document.getElementById('scorekeeper');
const nameBox = document.getElementById('nameBox');
const resetButton = document.getElementById('resetButton');
const historyText = document.getElementById('historyText');
const highScoreText = document.getElementById('highScore');
const gameStateButton = document.getElementById('seeGameState');
const resetHighScoreButton = document.getElementById('resetHighScoreButton');
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', startGame);
submitNameButton.addEventListener('click', changeUserName);
resetButton.addEventListener('click', resetGame);
gameStateButton.addEventListener('click', seeGameState);
resetHighScoreButton.addEventListener('click', resetHighScore);
const myStorage = window.localStorage;

function startGame () {
  startButton.hidden = true;
  startTime = Date.now();
  main();
}
function setupGameState() {
  try {
    gameState = JSON.parse(myStorage.getItem('gameState'));
    gameState.currentUser = currUser;
  } catch (e) {
      console.log('No prior game state found. Making new Game state');
      gameState = {
        currentUser: "anonymous",
        highScore: {
          user: "nobody",
          score: 0,
          date: new Date().toGMTString()
        },
        gameHistory: [
          { user: "Chloe", score: 21, date: "Thu Oct 01 2019 15:11:51 GMT-6000" },
          { user: "Duc", score: 19, date: "Thu Sep 03 2019 15:11:51 GMT+0700" },
          { user: "Huy", score: 18, date: "Thu Oct 03 2019 15:11:51 GMT+0700" }
        ]
      };
      myStorage.setItem('gameState', JSON.stringify(gameState));
  }
  high_score = gameState.highScore.score;
  highScoreText.innerHTML = `High Score: ${high_score} (user: ${gameState.highScore.user})`;
}
function editGameState() {
  // let match = {
  //   round: currRound,
  //   scored: score
  // }
  if(gameState.highScore.score < score) {
    gameState.highScore.user = currUser;
    gameState.highScore.score = score;
    gameState.highScore.date = new Date().toGMTString()
  }

}
function seeGameState() {
  console.log(gameState);
  // myStorage.setItem('gameState', JSON.stringify(gameState));
}
/*Problem is highScore will always be overriden
by the constantly running update(). So the handleTime()
is always setting the gamestate highScore if 
score > high_score. So unless the current score is 0,
the highScore object in gamestate will always have the current
score when you press reset*/
function resetHighScore() {
  gameState.highScore.user = 'nobody';
  gameState.highScore.score = 0;
  gameState.highScore.date = new Date().toGMTString();
  gameState.gameHistory.splice(0, gameState.gameHistory.length);//clear out history too
  myStorage.setItem('gameState', JSON.stringify(gameState));
}
function changeUserName() {
  if(nameInputBox.value === '') 
    nameInputBox.value = 'anonymous';

  nameBox.innerHTML = `Player Name: ${nameInputBox.value}`;
  currUser = nameInputBox.value;
  gameState.currentUser = nameInputBox.value;
  nameInputBox.value = '';//clear input
  nameInputBox.hidden = true;
  submitNameButton.hidden = true;
}
function resetGame() {
  //record match first
  let match = {
    user: currUser,
    score: score,
    date: new Date().toGMTString()
  }
  gameState.gameHistory.push(match);
  // historyScoresArray.push(match);
  historyText.innerHTML = JSON.stringify(gameState.gameHistory);
  //reset values
  score = 0;
  scoreDisplay.innerHTML = `Current Score: ${score}`;
  gameFinished = false;
  //record new starting time
  startTime = Date.now();
  resetButton.hidden = true;
  ++currRound;
  // console.log(historyScoresArray);
}

function loadImages() {
  bgImage = new Image();
  bgImage.onload = function () {
    // show the background image
    bgReady = true;
  };
  bgImage.src = "images/background.png";
  heroImage = new Image();
  heroImage.onload = function () {
    // show the hero image
    heroReady = true;
  };
  heroImage.src = "images/hero.png";

  monsterImage = new Image();
  monsterImage.onload = function () {
    // show the monster image
    monsterReady = true;
  };
  monsterImage.src = "images/car2-sm.png";
}

/** 
 * Setting up our characters.
 * 
 * Note that heroX represents the X position of our hero.
 * heroY represents the Y position.
 * We'll need these values to know where to "draw" the hero.
 * 
 * The same applies to the monster.
 */

let heroX = canvas.width / 2;
let heroY = canvas.height / 2;

let monsterX = 100;
let monsterY = 100;

/** 
 * Keyboard Listeners
 * You can safely ignore this part, for now. 
 * 
 * This is just to let JavaScript know when the user has pressed a key.
*/
let keysDown = {};
function setupKeyboardListeners() {
  // Check for keys pressed where key represents the keycode captured
  // For now, do not worry too much about what's happening here. 
  addEventListener("keydown", function (key) {
    keysDown[key.keyCode] = true;
  }, false);

  addEventListener("keyup", function (key) {
    delete keysDown[key.keyCode];
  }, false);
}

/*Displays time as game progresses and handles what 
happens when user runs out of time. Round ends, high
score gets recorded and uploaded to myStorage leaderboard */
function handleTime() {
  // Update the time.
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  if(SECONDS_PER_ROUND - elapsedTime <= 0) {
    timeLeft = 0;
    gameFinished = true;
    resetButton.hidden = false;

    editGameState();//update game States high score at end of a round
    if(score > high_score) {
      high_score = score;
      highScoreText.innerHTML = `High Score: ${high_score} (user: ${currUser})`;
    }
    myStorage.setItem('gameState', JSON.stringify(gameState));
  }
  else {
    timeLeft = SECONDS_PER_ROUND - elapsedTime;
  }
}
/**
 *  Update game objects - change player position based on key pressed
 *  and check to see if the monster has been caught!
 *  
 *  If you change the value of 5, the player will move at a different rate.
 */
let update = function () {
  handleTime();

  if(gameFinished === false) {
    if (38 in keysDown) { // Player is holding up key
      heroY -= 5;
    }
    if (40 in keysDown) { // Player is holding down key
      heroY += 5;
    }
    if (37 in keysDown) { // Player is holding left key
      heroX -= 5;
    }
    if (39 in keysDown) { // Player is holding right key
      heroX += 5;
    }
  }
  heroBoundaries();
  monsterBoundaries();
  randomMonsterMovement();
 
  if (
    heroX <= (monsterX + 32)
    && monsterX <= (heroX + 32)
    && heroY <= (monsterY + 32)
    && monsterY <= (heroY + 32)
  ) {
    // Pick a new location for the monster.
    // Note: Change this to place the monster at a new, random location.
    monsterX = Math.floor(Math.random() * canvas.width-25);
    monsterY = Math.floor(Math.random() * canvas.height-25);
    ++score;

  }
};


function heroBoundaries() {
  if(heroX < 0) {
    heroX = canvas.width-25;
  }
  if(heroX > canvas.width-25) {
    heroX = 0;
  }
  if(heroY < 0) {
    heroY = canvas.height-25;
  }
  if(heroY > canvas.height-25) {
    heroY = 0;
  }
};
function monsterBoundaries() {
  if(monsterX < 0) {
    monsterX = canvas.width-25;
  }
  if(monsterX > canvas.width-25) {
    monsterX = 0;
  }
  if(monsterY < 0) {
    monsterY = canvas.height-25;
  }
  if(monsterY > canvas.height-25) {
    monsterY = 0;
  }
};
function randomMonsterMovement() {
  let monsterXMovement = Math.random() * 4;
  let monsterYMovement = Math.random() * 4;
  // if(Math.random() <= 0.49)
  //   monsterXMovement = -monsterXMovement;
  // if(Math.random() <= 0.49)
  //   monsterYMovement = -monsterYMovement;
  if(gameFinished === false) {
    monsterX = monsterX + monsterXMovement;
    monsterY = monsterY + monsterYMovement;
  }
  // Check if player and monster collided. Our images
  // are about 32 pixels big.
}
/**
 * This function, render, runs as often as possible.
 */
var render = function () {
  if (bgReady) {
    ctx.drawImage(bgImage, 0, 0);
  }
  if (heroReady) {
    ctx.drawImage(heroImage, heroX, heroY);
  }
  if (monsterReady) {
    ctx.drawImage(monsterImage, monsterX, monsterY);
  }
  
  ctx.fillStyle = "#eeeeee"; 
  ctx.font = "bold 24px verdana, sans-serif ";
  ctx.fillText(`Seconds Remaining: ${timeLeft}`, 5, 30);
  
  scoreDisplay.innerHTML = `Current score: ${score}`;
  ctx.fillText(`Score: ${score}`, 5, 70);
};

/**
 * The main game loop. Most every game will have two distinct parts:
 * update (updates the state of the game, in this case our hero and monster)
 * render (based on the state of our game, draw the right things)
 */
var main = function () {
  // setupGameState();
  update(); 
  render();
  // Request to do this again ASAP. This is a special method
  // for web browsers. 
  requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame.
// Safely ignore this line. It's mostly here for people with old web browsers.
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
loadImages();
setupKeyboardListeners();
setupGameState();
// main();