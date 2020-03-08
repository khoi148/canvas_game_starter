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
let randomSpeed = Math.max(5, Math.random() * 12);

// canvas = document.createElement("canvas");
canvas = document.getElementById('mycanvas');
ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;
let HERO_HEIGHT = 100;
let HERO_WIDTH = 100;
let MONSTER_WIDTH = 100;
// document.body.appendChild(canvas);

let bgReady, heroReady, monsterReady, monster2Ready;
let bgImage, heroImage, monsterImage, monster2Image;

let startTime = Date.now();
const SECONDS_PER_ROUND = 12;
let elapsedTime = 0;
let score = 0;
let gameFinished = false;
let timeLeft;
let high_score = 0;
const historyScoresArray = [];
let gameState = {};
let currUser = 'anonymous'; 

const nameInputBox = document.getElementById('nameInputBox');
const submitNameButton = document.getElementById('submitNameButton');
const scoreDisplay = document.getElementById('scorekeeper');
const nameBox = document.getElementById('nameBox');
const resetButton = document.getElementById('resetButton');
const highScoreText = document.getElementById('highScore');
const gameStateButton = document.getElementById('seeGameState');
const resetHighScoreButton = document.getElementById('resetHighScoreButton');
const startButton = document.getElementById('startButton');
const historyTable = document.getElementById('historyTable');

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
    console.log(gameState);
  } catch (e) {
      console.log('No prior game state found. Making new Game state');
      gameState = {
        currentUser: "anonymous",
        highScore: {
          user: "nobody",
          score: 0,
          date: new Date().toGMTString()
        },
        gameHistory: []
      };
      myStorage.setItem('gameState', JSON.stringify(gameState));
  }
  high_score = gameState.highScore.score;
  highScoreText.innerHTML = `High Score: ${high_score} (user: ${gameState.highScore.user})`;
}
function editGameState() {
  if(gameState.highScore.score < score) {
    gameState.highScore.user = currUser;
    gameState.highScore.score = score;
    gameState.highScore.date = new Date().toGMTString()
  }
}
function seeGameState() {
  console.log(gameState);
}
/*Problem is highScore will always be overriden
by the constantly running update(). So the handleTime()
is always setting the gamestate highScore if 
score > high_score. So unless the current score is 0,
the highScore object in gamestate will always have the current
score when you press reset*/
function resetHighScore() {
  high_score = 0;
  gameState.highScore.user = 'nobody';
  gameState.highScore.score = 0;
  gameState.highScore.date = new Date().toGMTString();
  gameState.gameHistory.splice(0, gameState.gameHistory.length);//clear out history too
  myStorage.setItem('gameState', JSON.stringify(gameState));
  highScore.innerHTML = "High Score: 0";
  deleteHistoryTable();
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

function deleteHistoryTable() {
  for(let x = historyTable.rows.length-1; x>0; x--) {//first row 1, is the header row
    historyTable.deleteRow(x);
  }
}
function updateHistoryTable() {
    deleteHistoryTable();
    for(let x=gameState.gameHistory.length-1; x>=0; x--) {
      let newRow = historyTable.insertRow();
      let user = gameState.gameHistory[x].user;
      let score = gameState.gameHistory[x].score;
      let date = gameState.gameHistory[x].date;
      newRow.innerHTML = `<td>${user}</td><td>${score}</td><td>${date}</td>`;
    }
}
function resetGame() {
  //record match first
  let match = {
    user: currUser,
    score: score,
    date: new Date().toGMTString()
  }
  gameState.gameHistory.push(match);
  updateHistoryTable();
  myStorage.setItem('gameState', JSON.stringify(gameState)); 
  //reset values
  score = 0;
  scoreDisplay.innerHTML = `Current Score: ${score}`;
  gameFinished = false;
  //record new starting time
  startTime = Date.now();
  resetButton.hidden = true;
  for(let mon = 0; mon < monsterArray.length; mon++) {
    monsterArray[mon].yposition = 0;
    monsterArray[mon].xposition = monsterXPositions[Math.floor(Math.random() * monsterXPositions.length)];
  }
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
const heroXPositions = [40, 180, 320, 460];
let increment = 15;
const monsterXPositions = [heroXPositions[0]+increment, heroXPositions[1]+increment, heroXPositions[2]+increment, heroXPositions[3]+increment];
let currPlayerPosition = 1;//index in the heroXPositions
let heroX = heroXPositions[1];
let heroY = canvas.height-HERO_HEIGHT;

let monster1 = {
  source: "images/star.png",
  xposition: monsterXPositions[Math.floor(Math.random() * 4)],
  yposition: 0,
  ready: false,
  speed: Math.max(3, Math.random() * 6)
};
let monster2 = {
  source: "images/heart-pixel-art-64x64.png",
  xposition: monsterXPositions[Math.floor(Math.random() * 4)],
  yposition: 0,
  ready: false,
  speed: Math.max(5, Math.random() * 10)
};
let monster3 = {
  source: "images/milk.png",
  xposition: monsterXPositions[Math.floor(Math.random() * 4)],
  yposition: 0,
  ready: false,
  speed: Math.max(8, Math.random() * 14)
};
let monsterArray = [];
let monsterImagesArray = [];
monsterArray.push(monster1, monster2, monster3);

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
      heroY -= 15;
    }
    if (40 in keysDown) { // Player is holding down key
      heroY += 15;
    }
    if (37 in keysDown) { // Player is holding left key
      delete keysDown[37];
      if(currPlayerPosition > 0) {
        currPlayerPosition--;
        heroX = heroXPositions[currPlayerPosition];
      }
    }
    if (39 in keysDown) { // Player is holding right key
      delete keysDown[39];
      if(currPlayerPosition < heroXPositions.length-1) {
        currPlayerPosition++;
        heroX = heroXPositions[currPlayerPosition];
      }
    }
  }
  monsterBoundaries();
  heroBoundaries();
  randomMonsterMovement();
  // Check if player and monster collided. Our images are about 100 pixels big
  for(let mon = 0; mon < monsterArray.length; mon++) {
    if (
      heroX <= (monsterArray[mon].xposition + MONSTER_WIDTH)
      && monsterArray[mon].xposition  <= (heroX + HERO_WIDTH)
      && heroY <= (monsterArray[mon].yposition + MONSTER_WIDTH-80)
      && (monsterArray[mon].yposition <= heroY + HERO_HEIGHT)
    ) {
      // Pick a new location for the monster.
      // Note: Change this to place the monster at a new, random location.
      // randomSpeed = Math.max(5, Math.random() * 12);//pick new speed after collision
      monsterArray[mon].yposition = 0 - Math.random()*300;
      monsterArray[mon].xposition = monsterXPositions[Math.floor(Math.random()*4)];
      ++score;
    }
  }
};

function heroBoundaries() {
  if(heroY < 0) {
    heroY = 0;
  }
  if(heroY > canvas.height-HERO_HEIGHT) {
    heroY = canvas.height-HERO_HEIGHT;
  }
};
function monsterBoundaries() {
  for(let mon = 0; mon < monsterArray.length; mon++) {
    if(monsterArray[mon].yposition > canvas.height) {
      monsterArray[mon].xposition = monsterXPositions[Math.floor(Math.random() * monsterXPositions.length)];
      monsterArray[mon].yposition = 0 - Math.random()*300;
    }
  }
};
function randomMonsterMovement() {
  if(gameFinished === false) {
    for(let mon = 0; mon < monsterArray.length; mon++) {
      monsterArray[mon].yposition += monsterArray[mon].speed;
    }
  }
}

function loadImages() {
  bgImage = new Image();
  bgImage.onload = function () {
    // show the background image
    bgReady = true;
  };
  bgImage.src = "images/background5.jpg";
  heroImage = new Image();
  heroImage.onload = function () {
    // show the hero image
    heroReady = true;
  };
  heroImage.src = "images/basket.png";

  for(let mon = 0; mon < monsterArray.length; mon++) {
    let newimage = new Image();
    monsterImagesArray.push(newimage);
    newimage.onload = function () {
      // show the monster image
      monsterArray[mon].ready = true;
    };
    newimage.src = monsterArray[mon].source;
  }
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
  for(let mon = 0; mon < monsterArray.length; mon++) {
    if(monsterArray[mon].ready === true)
      ctx.drawImage(monsterImagesArray[mon], monsterArray[mon].xposition, monsterArray[mon].yposition);
  }
  ctx.fillStyle = "#eeeeee"; 
  ctx.font = "bold 24px verdana, sans-serif ";
  ctx.fillText(`Seconds Remaining: ${timeLeft}`, 5, 30);
  
  scoreDisplay.innerHTML = `Current score: ${score}`;
  ctx.fillText(`Score: ${score}`, 5, 70);
  if(SECONDS_PER_ROUND - elapsedTime <= 0)
    ctx.fillText(`Round Over`, 200, canvas.height/2);
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
updateHistoryTable();