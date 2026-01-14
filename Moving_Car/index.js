const audio = document.createElement('audio');
audio.setAttribute('src', 'sound.mp3');
audio.loop = true;

// DOM Elements
const track = document.querySelector('.track');
const car = document.querySelector('.car');
const scoreElement = document.querySelector('.score');
const highScoreElement = document.querySelector('.high-score');
const gameOverElement = document.querySelector('.game-over');
const finalScoreElement = document.getElementById('finalScore');
const sky = document.querySelector('.sky');

// Game State
let isGameOver = false;
let score = 0;
let highScore = localStorage.getItem('racingHighScore') || 0;
let speed = 10;
let trackPosition = 0;
let obstacles = [];
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowRight: false,
    ArrowLeft: false
};
let lastTime = 0;
let obstacleSpawnTimer = 0;
let currentLane = 1; // Start in middle (0, 1, 2)

// Initial UI
highScoreElement.innerText = `Best: ${highScore}`;

// Config
// Road height is 300px. Track bottom: 0.
// Track is 300px tall. lane height ~100px.
// Car height is 90px.
const LANE_POSITIONS = [210, 110, 10]; // Bottom values (not used directly, but for conceptual understanding)
const MAX_SPEED = 50; // Increased max speed
const MIN_SPEED = 10;

// Audio
document.body.addEventListener('click', () => {
    // audio.play(); // Allow autoplay policy
});

// Update car position immediately
function updateCarPosition() {
    // We modify style.bottom because track is bottom aligned
    // But .car in CSS was top aligned? CSS has `transition: top`.
    // Let's change .car to use bottom to match track relative logic or calc top.
    // Screen height 100vh. Track height 300px.
    // Track top = 100vh - 300px.
    // Lane 0 top = (100vh - 300px) + 10px ??
    // Let's stick to bottom for simplicity if we change CSS, BUT CSS had `top: 60%`.
    // Let's calculate `top` dynamically.
    const trackHeight = 300;
    const laneHeight = 100;
    const carHeight = 90;
    const centerOffset = (laneHeight - carHeight) / 2;
    // Lane 0 is top of road.
    // Position from top of screen: (WindowHeight - TrackHeight) + (LaneIndex * LaneHeight) + Offset
    const roadTop = window.innerHeight - trackHeight;
    const topPos = roadTop + (currentLane * laneHeight) + centerOffset;
    car.style.top = `${topPos}px`;
    car.style.left = '100px'; // Ensure x pos
}

// Controls
document.addEventListener('keydown', (e) => {
    if (isGameOver) {
        if (e.code === 'Enter') resetGame();
        return;
    }

    if (e.key === 'ArrowUp') {
        if (currentLane > 0) {
            currentLane--;
            updateCarPosition();
        }
    } else if (e.key === 'ArrowDown') {
        if (currentLane < 2) {
            currentLane++;
            updateCarPosition();
        }
    }

    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Resize listener to keep car on track
window.addEventListener('resize', updateCarPosition);

function resetGame() {
    isGameOver = false;
    score = 0;
    speed = 10;
    trackPosition = 0;
    currentLane = 1;

    // Remove all existing obstacles
    obstacles.forEach(obs => obs.element.remove());
    obstacles = [];

    gameOverElement.style.display = 'none';
    scoreElement.innerText = `Score: 0`;

    updateCarPosition();
    audio.play().catch(e => { });

    requestAnimationFrame(gameLoop);
}

function spawnObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');

    // Traffic Logic
    // Lane 0 (Top): Oncoming (High Danger)
    // Lane 1 (Mid): Mixed
    // Lane 2 (Bot): Slow Traffic (Overtake)

    const laneIndex = Math.floor(Math.random() * 3);
    let type = 'oncoming'; // Default

    if (laneIndex === 0) {
        type = 'oncoming'; // Always oncoming in fast lane
        obstacle.classList.add('obstacle-oncoming');
    } else if (laneIndex === 2) {
        type = 'traffic'; // Always slow traffic in slow lane
        obstacle.classList.add('obstacle-traffic');
    } else {
        // Randomize middle lane
        type = Math.random() > 0.5 ? 'oncoming' : 'traffic';
        obstacle.classList.add(type === 'oncoming' ? 'obstacle-oncoming' : 'obstacle-traffic');
    }

    const trackHeight = 300;
    const laneHeight = 100;
    const carHeight = 90;
    const centerOffset = (laneHeight - carHeight) / 2;
    const roadTop = window.innerHeight - trackHeight;
    const topPos = roadTop + (laneIndex * laneHeight) + centerOffset;

    obstacle.style.top = `${topPos}px`;

    // Start X position matches type?
    // Oncoming: Starts Right (100vw), moves Left.
    // Traffic: Starts Right (100vw) or Left (-20vw)?
    // "Overtaking": If we overtake them, they are slower than us. Relative speed = (TrafficSpeed - PlayerSpeed).
    // If Player > Traffic, they move Left relative to screen.
    // So visual movement is mostly Left for everyone if we are the fastest thing.
    // BUT if we want "Two way", oncoming moves Left FAST. Traffic moves Left SLOW.
    // Spawning from Right works for both if Player is fastest.

    obstacle.style.left = '100vw';

    sky.appendChild(obstacle);

    obstacles.push({
        element: obstacle,
        x: 100,
        lane: laneIndex,
        type: type,
        speedOffset: type === 'oncoming' ? 10 : -15, // Oncoming adds speed, Traffic subtracts
        passed: false
    });
}

function checkCollision(obstacle) {
    // Simple lane check + X overlap since Y is discrete
    if (obstacle.lane !== currentLane) return false;

    // X collision?
    // Car X is fixed 100px. Width 200px.
    // Obstacle X is in VW. Need to convert.
    const carLeft = 100;
    const carRight = 300; // 100 + 200

    const obsLeft = (obstacle.x * window.innerWidth) / 100;
    const obsRight = obsLeft + 200; // Approx fixed width?
    // Wait, styling says width 200px.

    const padding = 20; // Forgiving collision box

    return ((carRight - padding) > (obsLeft + padding) && (carLeft + padding) < (obsRight - padding));
}

function gameLoop(timestamp) {
    if (isGameOver) return;

    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Difficulty Scale: Speed increases over time
    speed += 0.005; // Gradual accel

    // User Speed Control (Boost/Brake)
    let currentSpeed = speed;
    if (keys.ArrowRight) currentSpeed += 15; // Boost
    if (keys.ArrowLeft) currentSpeed -= 5; // Brake

    // Clamp speed
    currentSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, currentSpeed));

    // Move Track (Visual only)
    // We move the dashed lines if using pseudo elements?
    // Pseudo elements `repeating-linear-gradient` usually stay fixed unless we animate `background-position` on track?
    // Actually, let's just animate the track background if we added one, or move the lines.
    // We can update a CSS variable for the line offset!
    // linePosition -= speed * 0.5; // REMOVED
    // Update pseudo element pos via style injection or just updating the track background if we put lines there.
    // Since I put lines in pseudo ::before/::after, I can't easily animate them with inline styles on track without CSS vars.
    // Let's use simple mechanic: Update track background position.
    // The road is solid color, lines could be background images.
    // Let's just animate track background position X?
    // No, track has solid color.
    // Let's set the dashed lines as multiple backgrounds on `.track` instead of pseudos for easier JS control.
    // Re-doing the CSS approach in memory:
    // .track { background: linear-gradient(...) lines ... }
    // Then track.style.backgroundPositionX = ...

    // Applying CSS var method is cleaner but let's stick to what we have.
    // I defined .track::before/after in CSS tool.
    // I can't reach them.
    // I'll assume standard motion for now (enemies move), road feels static unless I fix it.
    // **Self-Correction**: I should fix the road animation.
    // I will use a simple trick: `track.style.setProperty('--line-offset', ...)` and use it in CSS.
    // track.style.setProperty('--line-offset', `${linePosition}px`); // REMOVED
    trackPosition -= currentSpeed * 0.5;
    track.style.backgroundPositionX = `${trackPosition}px`; // Animate background image

    // Spawn
    obstacleSpawnTimer += deltaTime;
    // Spawn faster if speed is high, but much slower overall base rate
    // Old: 300000. New: 700000. 
    // Also ensuring minimum time between spawns to avoid overlapping cars too much

    const spawnThreshold = 700000 / (currentSpeed * 10);

    if (obstacleSpawnTimer > spawnThreshold) {
        // Extra check: Don't spawn if too many cars on screen (Max 3)
        if (obstacles.length < 3) {
            spawnObstacle();
            obstacleSpawnTimer = 0;
        } else {
            // Wait a bit longer if full
            obstacleSpawnTimer = spawnThreshold * 0.5;
        }
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];

        // Relative Speed Logic
        // Base move speed = currentSpeed
        // Oncoming = currentSpeed + obs.speedOffset (Approaches fast)
        // Traffic = currentSpeed + obs.speedOffset (Approaches slow, speedOffset is negative)

        // Actually, logic is:
        // moveLeft = (PlayerSpeed - EnemySpeed)
        // Oncoming EnemySpeed = -20 (moving left) -> moveLeft = Player - (-20) = Player + 20 (Super fast)
        // Traffic EnemySpeed = 10 (moving right slow) -> moveLeft = Player - 10 (Slow left move)
        // So `speedOffset` handles this.

        let relativeSpeed = currentSpeed + obs.speedOffset;

        obs.x -= (relativeSpeed * 0.05);
        obs.element.style.left = `${obs.x}vw`;

        if (checkCollision(obs)) {
            isGameOver = true;
            gameOver();
        }

        if (obs.x < -30) {
            obs.element.remove();
            obstacles.splice(i, 1);
        }

        if (!obs.passed && obs.x < 5) { // 5vw is roughly past 100px+200px
            score += 10;
            scoreElement.innerText = `Score: ${score}`;
            obs.passed = true;

            // Check High Score Live
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('racingHighScore', highScore);
                highScoreElement.innerText = `Best: ${highScore}`;
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameOverElement.style.display = 'block';
    finalScoreElement.innerText = score;
    audio.pause();
}

// Start Game
resetGame();
