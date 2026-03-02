const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');

let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;

// Bilder
const playerImg = new Image();
playerImg.src = 'assets/player.png';

const enemyImg = new Image();
enemyImg.src = 'assets/enemy.png';

const bossImg = new Image();
bossImg.src = 'assets/boss.png';

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.jpg';

const startScreenImg = new Image();
startScreenImg.src = 'assets/startScreen.jpg';

const gameOverImg = new Image();
gameOverImg.src = 'assets/gameOver.jpg';

const explosionImg = new Image(); // optional: Explosion
explosionImg.src = 'assets/explosion.png';

const bossSound = new Audio('assets/bossSound.mp3');

// Spieler
const player = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 150,
    width: 100,
    height: 100,
    speed: 10,
    health: 3
};

// Gegner
const enemies = [];
const enemySpawnInterval = 2000;
const enemyTypes = [
    {width: 50, height:50, speed:2, health:1, img: enemyImg},
    {width: 70, height:70, speed:1.5, health:2, img: enemyImg},
];

// Boss
let boss = null;
let bossAttackCooldown = 0;

// Projektile
const bullets = [];

// Steuerung
let keys = {};
document.addEventListener('keydown', e => {
    keys[e.code] = true;
});
document.addEventListener('keyup', e => {
    keys[e.code] = false;
    if(e.code === 'Space') shoot();
});

// Bullets
function shoot() {
    if(!gameStarted || gameOver) return;
    bullets.push({
        x: player.x + player.width/2 - 5,
        y: player.y,
        width: 10,
        height: 20,
        speed: 15,
        owner: 'player'
    });
}

// Gegner spawnen
function spawnEnemy() {
    if(!gameStarted || gameOver) return;
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const x = Math.random() * (canvas.width - type.width);
    enemies.push({
        x: x,
        y: -type.height,
        width: type.width,
        height: type.height,
        speed: type.speed,
        health: type.health,
        img: type.img
    });
}

// Boss zufällig spawnen
function maybeSpawnBoss() {
    if(!gameStarted || gameOver) return;
    if(!boss && Math.random() < 0.003) {
        boss = {
            x: canvas.width/2 - 100,
            y: 50,
            width: 200,
            height: 200,
            health: 20,
            attackSpeed: 3,
            bullets: []
        };
    }
}

// Kollision
function checkCollision(a,b){
    return (a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y);
}

// Update
function update() {
    if(!gameStarted || gameOver) return;

    // Spielerbewegung
    if(keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if(keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
    if(keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if(keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;

    // Bullets bewegen
    bullets.forEach((b, i) => {
        if(b.owner === 'player') b.y -= b.speed;
        else b.y += b.speed;

        if(b.y + b.height < 0 || b.y > canvas.height) bullets.splice(i,1);
    });

    // Gegner bewegen
    enemies.forEach((e, i) => {
        e.y += e.speed;
        bullets.forEach((b,j) => {
            if(b.owner==='player' && checkCollision(b,e)){
                e.health--;
                bullets.splice(j,1);
                if(e.health <=0){
                    enemies.splice(i,1);
                    score++;
                    scoreDisplay.textContent = `Score: ${score}`;
                }
            }
        });

        if(checkCollision(player,e)){
            player.health--;
            enemies.splice(i,1);
            if(player.health <=0) endGame();
        }

        if(e.y > canvas.height) endGame();
    });

    // Boss bewegen
    if(boss){
        boss.y += 0.3; // langsam
        bossAttackCooldown--;
        if(bossAttackCooldown <=0){
            bossAttackCooldown = 120; // Boss schießt alle 2s
            boss.bullets.push({
                x: boss.x + boss.width/2 - 5,
                y: boss.y + boss.height,
                width: 10,
                height: 20,
                speed: 8,
                owner:'boss'
            });
        }

        bullets.forEach((b,j)=>{
            if(b.owner==='player' && checkCollision(b,boss)){
                boss.health--;
                bullets.splice(j,1);
                if(boss.health <=0){
                    bossSound.play();
                    boss=null;
                    score += 10;
                    scoreDisplay.textContent = `Score: ${score}`;
                }
            }
            if(b.owner==='boss' && checkCollision(b,player)){
                bullets.splice(j,1);
                player.health--;
                if(player.health <=0) endGame();
            }
        });
    }
    maybeSpawnBoss();
}

// Draw
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(!gameStarted){
        ctx.drawImage(startScreenImg, 0,0,canvas.width,canvas.height);
        return;
    }
    if(gameOver){
        ctx.drawImage(gameOverImg, 0,0,canvas.width,canvas.height);
        return;
    }

    ctx.drawImage(backgroundImg, 0,0,canvas.width,canvas.height);
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    bullets.forEach(b=>{
        ctx.fillStyle = b.owner==='player'?'yellow':'red';
        ctx.fillRect(b.x,b.y,b.width,b.height);
    });

    enemies.forEach(e=>ctx.drawImage(e.img,e.x,e.y,e.width,e.height));
    if(boss){
        ctx.drawImage(bossImg,boss.x,boss.y,boss.width,boss.height);
        boss.bullets.forEach(b=>{
            ctx.fillStyle='red';
            ctx.fillRect(b.x,b.y,b.width,b.height);
        });
    }
}

// Hauptschleife
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start / Restart
function startGame(){
    gameStarted=true;
    gameOver=false;
    startButton.style.display='none';
    restartButton.style.display='none';
    scoreDisplay.style.display='inline';
    enemies.length=0;
    bullets.length=0;
    boss=null;
    player.health=3;
    score=0;
    scoreDisplay.textContent=`Score: ${score}`;
}

// Ende
function endGame(){
    gameOver=true;
    restartButton.style.display='inline';
    if(score>highScore) highScore=score;
}

// Event Listener
startButton.addEventListener('click',startGame);
restartButton.addEventListener('click',startGame);

// Gegner spawnen
setInterval(spawnEnemy,enemySpawnInterval);
gameLoop();

// Bildschirm anpassen
window.addEventListener('resize', ()=>{
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
});
