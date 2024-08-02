const gameOverSound = new Audio("./music/gameover3.mp3");
const eatingSound = new Audio("./music/food.mp3");
const gameMusic = new Audio("./music/music.mp3");
const clickSound = new Audio("./music/buttonClick.mp3");

let soundMedia = [gameOverSound , eatingSound , gameMusic , clickSound];
 // needs attention and modification
window.addEventListener('load' , ()=>{
    soundMedia.forEach(sound =>{
        sound.preload ='auto';
    });
    activateMove();

    document.querySelector('.loading').style.display ="none";
});

const container =  document.querySelector('.container');
const controller = document.querySelector('.controller');
const board = document.querySelector('.board');
const settingImg = document.querySelector('.settingImg');
const settingUI = document.querySelector('.moveToSettingImg');
const cancelButton = document.querySelector('.cancelButton');
const level = document.querySelector('.level');
const sound = document.querySelector('.sound');
const snakeLook = document.querySelector('.snakeLook');
const pauseAndPlay = document.querySelector('.pause-play');
const volumeController = document.querySelector('#volumeOfMusic');


let fps =70;
let gamePaused = false;
let wasGameOver = false;
let score =0;
let highScore =0;
let deathWall = false;
let inputDir = {x:0 , y:0};  // keeps track which direction user wants to move
let food ={x:6,y:9 ,element:{}}; // intitial food location 
let snakeBody =[{x:13,y:18,element :{}}];  // storing the element and its coordinate ->here it is initial coordinate
let lastTimeStamp =0;
let oneColorSnake = false;
let currentLevel = "Easy";
let highEasyScore = 0 , highMediumScore = 0 , highHardScore = 0;

function initialState(isCalledFrom){  //isCalledFrom  would specify from where initialState fn is called , so that accordingly modification can be done to the initialState fn
    
    if(isCalledFrom === "retryBtnClickEvent"){  // bcz we dont want to restrt the music when options of setting are choosen/clicked
        // gameMusic.autoplay = true; // bcz browser blocks autoplay so explicitely u have to autoplay  -> but no gaurantee -> user must interact to play music
        gameMusic.loop = true;
        gameMusic.pause();
        gameMusic.currentTime =0;
        gameMusic.play();
    }

    let pausedText = document.querySelector('.paused');   // game may have been paused while restarting -> so remove the "Paused" written text
    if(pausedText)  // remove only when present else paused has null and null.remove() is an error
    pausedText.remove();

    let gameOverText = document.querySelector('.over');  //  remove the game over text when game is over and wants to replay 
    if(gameOverText)
    gameOverText.remove();

    // may be user would have paused and clicked for retry / or chnaged the level from setting -> so make paused image to play image 
    pauseAndPlay.src="images/play.png";

    board.innerHTML = "";   // once game is restarted/started -> make the board clear of previous snake 
    score = 0;
    wasGameOver = false;
    gamePaused = false;
    inputDir = {x:0 , y:0};
    food ={x:6,y:9 ,element:{}};
    snakeBody =[{x:13,y:18,element :{}}]; 

    let snakeHead = document.createElement('div');
    snakeBody[0].element=snakeHead;
       
    snakeHead.classList.add('head');
    snakeHead.style.gridRowStart=snakeBody[0].y;
    snakeHead.style.gridColumnStart=snakeBody[0].x;
    board.appendChild(snakeHead);   

    let foodImg = document.createElement('img');
    foodImg.src="images/appleFood.png"; 
    foodImg.classList.add('food');
    food.element= foodImg;
    foodImg.style.gridRowStart=food.y;
    foodImg.style.gridColumnStart=food.x;
    board.appendChild(foodImg);

    
    // start the game
    requestAnimationFrame(perFrame);
}
initialState("globalScope");



function perFrame(currTime){
    if(gamePaused) return;  // if true will pause the game by not calling the callback of RAF hence no furthur frame to paint for the game

    requestAnimationFrame(perFrame);
    
    // let fps = 20;   // 70 40 20
   
    if((currTime - lastTimeStamp) <= fps) return;   // control fps manually
    lastTimeStamp = currTime;
   
    gameEngine();
}
function LevelAndScore(){
   let levelValue = document.querySelector('.levelValue');
   levelValue.innerHTML =`${currentLevel}`;
  
   score = snakeBody.length - 1;

   let currentScore = document.querySelector('.currentScoreVlaue');
   currentScore.innerHTML = `${score}`;
   
   let highScorevalue = document.querySelector('.highScorevalue'); 

   if(currentLevel === "Easy"){
    highEasyScore = Math.max(score , highEasyScore);
    highScorevalue.innerHTML = `${highEasyScore}`;
   }
   else if(currentLevel === "Medium"){
    highMediumScore = Math.max(score , highMediumScore);
    highScorevalue.innerHTML = `${highMediumScore}`;
   }
   else {
    highHardScore = Math.max(score , highHardScore);
    highScorevalue.innerHTML = `${highHardScore}`;
   }


}
function strikedToWall(){
    if(snakeBody[0].x === 0 || snakeBody[0].x === 30 || snakeBody[0].y ===0 || snakeBody[0].y ===30) return true;
    return false;
}
function gameEngine(){
   
     if(ateSelf() || (strikedToWall() && deathWall)){   
                
        if(wasGameOver){
            gamePaused = true;
            return;
        }
        gameOver();

        return;

    }

    // show the level , currentScore and highest score of that level 
    LevelAndScore();
    
    // move body of snake
    for(let i = snakeBody.length-1; i>0; i--){
        snakeBody[i].x=snakeBody[i-1].x;
        snakeBody[i].y=snakeBody[i-1].y;
      snakeBody[i].element.style.gridRowStart = snakeBody[i].y;
      snakeBody[i].element.style.gridColumnStart = snakeBody[i].x;

    }

    // eat food and realloacte it
    if(snakeBody[0].x === food.x && snakeBody[0].y === food.y){
       addNewHead();
       eatingSound.pause();
       eatingSound.currentTime=0;
       eatingSound.play();
       reAllocateFood();
    }
    else{       
        // move the head of snake in the current direction given by user in inputDir object
        snakeBody[0].x += inputDir.x;
        snakeBody[0].y += inputDir.y;
        snakeBody[0].element.style.gridRowStart = snakeBody[0].y;
        snakeBody[0].element.style.gridColumnStart = snakeBody[0].x;
    }
     // check if wall of death is turned on or off
    if(!deathWall){
        //if gone outside the boundary - then bring the snake inside -> bring only head other part will follow the head
        if(snakeBody[0].x === 0) snakeBody[0].x = 30;
        else if(snakeBody[0].x === 31) snakeBody[0].x =0;
        else if(snakeBody[0].y === 0) snakeBody[0].y = 30;
        else if(snakeBody[0].y === 31) snakeBody[0].y=0;
    }
}
function gameOver(){   // think to pause RAF
    gameOverSound.pause();
    gameOverSound.currentTime =0; 
    gameOverSound.play();

    gamePaused = true;
    wasGameOver = true;
    
    let over = document.createElement('h3');
    over.innerHTML = `!Game Over!<br> Restart to Replay`;
    over.classList.add('over');
    container.appendChild(over);

    // done nothing , means be in state when snake ate itself 
}

function ateSelf(){
   for(let i =1;i<snakeBody.length-1 ; i++){
        if(snakeBody[0].x === snakeBody[i].x  && snakeBody[0].y === snakeBody[i].y) return true;
   }
   return false;
}
function addNewHead(){
    let newHead = document.createElement('div');

    snakeBody[0].element.classList.remove('head','head-right' , 'head-left' ,'head-up' ,'head-down');  // remove orientation of previous head 
    
    if(!oneColorSnake){

        if(snakeBody.length %2 ==0)
        snakeBody[0].element.classList.add('bodyPart2');
        else
        snakeBody[0].element.classList.add('bodyPart1');
    }
    else 
    snakeBody[0].element.classList.add('bodyPart1');

    snakeBody.unshift({x: (snakeBody[0].x + inputDir.x ), y:(snakeBody[0].y + inputDir.y) , element:newHead}); // allocate the new head to the position which would have been the position of previous head in next frame , hence use inputDir for the refrence in which direction it was moving 
  
    newHead.classList.add('head');                 
    newHead.style.gridRowStart=snakeBody[0].y;
    newHead.style.gridColumnStart=snakeBody[0].x;
    board.appendChild(newHead);

    // we have new head , so orient it now
    updateHeadOrientation();

}
function reAllocateFood(){
    let a =2, b =28;    // igonre 0 and 40 for simplicity else becomes hard to eat boundary food
    let x1 = Math.floor(Math.random()*(b-a+1)) +a;
    let y1 = Math.floor(Math.random()*(b-a+1)) +a;
    food.x = x1;
    food.y = y1;
    
    // console.log(x1 , y1);
    food.element.style.gridRowStart=food.y;
    food.element.style.gridColumnStart=food.x;

}    
function activateMove(){

    document.addEventListener('keydown', (e) => {
        if(gamePaused) return;
        if(e.code !="ArrowDown" && e.code != "ArrowUp" && e.code != "ArrowRight" && e.code != "ArrowLeft") return; // allow only arrow kyes
    
       // play music once game starts 
       gameMusic.loop = true;
       gameMusic.volume =  (parseInt( volumeController.value) / 100); 
       gameMusic.play();
    
        controller.style.opacity =1; // make the pause-play and retry controllers icons visible once game started for forEver
        controller.style.pointerEvents = "auto";
        
        // restrain some moves
        if(inputDir.x ===1 && e.code === "ArrowLeft") return;
        if(inputDir.x ===-1 && e.code === "ArrowRight") return;
        if(inputDir.y ===1 && e.code === "ArrowUp") return;
        if(inputDir.y ===-1 && e.code === "ArrowDown") return;
    
        inputDir ={x:0 , y:0};    //reset to avoid some residue
        
        if(e.code==="ArrowDown") inputDir.y =1;
        else if(e.code ==="ArrowUp") inputDir.y=-1;
        else if(e.code ==="ArrowRight") inputDir.x=1;
        else if(e.code ==="ArrowLeft") inputDir.x=-1;
       
        // orientation is changed by Arrow keys so call the fn
        updateHeadOrientation(); 
       
    });   
    
}

function updateHeadOrientation() {
    const head = snakeBody[0].element;
    head.classList.remove('head-up', 'head-right', 'head-down', 'head-left');  //remove previous orientation by removing the class

    if (inputDir.x === 1) {        // add orientation acc to the inputDirection
        head.classList.add('head-right');
    } else if (inputDir.x === -1) {
        head.classList.add('head-left');
    } else if (inputDir.y === 1) {
        head.classList.add('head-down');
    } else if (inputDir.y === -1) {
        head.classList.add('head-up');
    }
}



pauseAndPlay.addEventListener('click', (e) => {
   
    let currentSrc = e.target.src.split('/').pop(); // Get the file name part of the URL 

    if (currentSrc === "play.png") {
        e.target.src = "images/pause.png";
        gamePaused = true;


        if(!wasGameOver){
            
            let paused = document.createElement('h3');
            paused.innerHTML = `Paused`;
            paused.classList.add('paused');
            container.appendChild(paused);
        }

    }else{
        e.target.src ="images/play.png";
        gamePaused = false;
        setTimeout(()=>{  // resume after 1s 
            requestAnimationFrame(perFrame);  // resume game by again calling RAF
        },1000);
        
        let pausedText = document.querySelector('.paused');
        if(pausedText)        // bcz if paused element object was there is doc , paused is null  and null.remove -> error
        pausedText.remove();
    }

    clickSound.pause();
    clickSound.currentTime = 0; // to make sure that on subsequent click of btn , it should play from start 
    clickSound.play();
   
});

let retryBtn = document.querySelector('.retry'); 
retryBtn.addEventListener('click', ()=>{
    clickSound.pause();
    clickSound.currentTime = 0; 
    clickSound.play();

    initialState("retryBtnClickEvent");
    
});
settingImg.addEventListener('click' ,()=>{
    clickSound.pause();
    clickSound.currentTime = 0; 
    clickSound.play();

    settingImg.style.opacity=0;
    settingImg.style.pointerEvents="none";
    gamePaused = true;
    settingUI.classList.remove('moveToSettingImg');  // move at top right corner where the settingImg is located
    settingUI.classList.add('moveSettingUItoCenter'); // move to centre to flash the setting controls
   
});

cancelButton.addEventListener('click' ,()=>{
    clickSound.pause();
    clickSound.currentTime = 0; 
    clickSound.play();
    
    let pausedText = document.querySelector('.paused');   // resume the game after clicking on cancel btn  but only when it was not paused manually by user  , also if game was over 'wasGameOver' , then on clicking it will have no effect bcz we already handled the case using the variable "wasGameOver" when we designed -> "what if user click pause and play btn after game was over"  , hence dont worry for that case here 
    if(!pausedText){
        gamePaused = false;
        setTimeout(()=>{
            requestAnimationFrame(perFrame);
        },1000);
    }

    settingImg.style.opacity=1;
    settingImg.style.pointerEvents="auto";
    settingUI.classList.remove('moveSettingUItoCenter');  //even the class is removed, its intial styles are removed ->so how the hell transition stills works here -> 'transition' property gets triggered whenever there is "change" ->of any type in a particular period of time , hence on removing and adding transition gets triggered
    settingUI.classList.add('moveToSettingImg');
    
});
level.addEventListener('click' , (e)=>{
    let target = e.target;
   if(target === document.querySelector('#easy') || target === document.querySelector('[for="easy"]') ){
      fps = 70;
      currentLevel = "Easy";
   }
   else if(target === document.querySelector('#medium') || target === document.querySelector('[for="medium"]') ){
    fps =40;
    currentLevel = "Medium";
   }
   else if(target === document.querySelector('#hard') || target === document.querySelector('[for="hard"]') ){
    fps = 20;
    currentLevel = "Hard";
   }
   else return;
   
   clickSound.pause();
   clickSound.currentTime = 0; 
   clickSound.play();

   initialState("levelClickEvent");
});

snakeLook.addEventListener('click' , (e)=>{
    let target = e.target;
   if(target === document.querySelector('#different') || target === document.querySelector('[for="different"]') ){
     oneColorSnake = false;      
   }
   else if(target === document.querySelector('#same') || target === document.querySelector('[for="same"]') ){
     oneColorSnake = true;
   }
   else return;
   
   clickSound.pause();
   clickSound.currentTime = 0; 
   clickSound.play();

   initialState("snakeLookClickEvent"); // for betterment ask user to make sure if he wants a restarted game , but let us restart for now
});

volumeController.addEventListener('input' , ()=>{
    gameMusic.volume = (parseInt( volumeController.value) / 100);  // value should be 0 to 1 but in range i have given [0,100] so divided by 100
});

// adding click event on the deathWall option to make the wall deadly for snake 

 document.querySelector('.deathWall').addEventListener('click' ,(e)=>{
    let target = e.target;

    if(target === document.querySelector("#wall") ){  // *****// imp concept ->  clicking on the label also , this will get trigerred (checkbox click)because label is internally associated with input tag(here checkbox) 
        //1. so if label is clicked -> it is like as if input tag is clicked (hence trigerring checkbox and hence on clickng the label this piece of code executes though not actually clicked checkbox) , 
        // 2. also event listener added on label is like event listener added on input  
        // reverse not true in both case


        // console.log(target);  // prints checkbox -> clicked checkbox or label


        if(deathWall === false) deathWall = true;
        else {
            deathWall = false;
            let checkbox =document.querySelector('#wall');    // used checkbox instead of radio bcz checkbox check/uncheck works better when more than one radio input is used 
    
            checkbox.checked = false;
        }
        clickSound.pause();
        clickSound.currentTime = 0; 
        clickSound.play();
     
        initialState("deathWallClickEvent");
    }
      
});
