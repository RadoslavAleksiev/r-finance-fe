// Raccoon Run Game - Vanilla JavaScript

class RaccoonRunGame {
  constructor() {
    this.gameState = 'waiting';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('raccoon-high-score') || '0');
    this.isJumping = false;
    this.obstacles = [];
    this.clouds = [];
    this.gameSpeed = 2;
    this.lastObstacleTime = 0;
    this.lastCloudTime = 0;

    this.scoreInterval = null;
    this.gameLoop = null;

    this.gameContainer = document.getElementById('gameContainer');
    this.raccoon = document.getElementById('raccoon');
    this.ground = document.getElementById('ground');
    this.obstaclesContainer = document.getElementById('obstaclesContainer');
    this.cloudsContainer = document.getElementById('cloudsContainer');
    this.startScreen = document.getElementById('startScreen');
    this.startButton = document.getElementById('startButton');
    this.currentScoreEl = document.getElementById('currentScore');
    this.highScoreEl = document.getElementById('highScore');
    this.finalScoreEl = document.getElementById('finalScore');
    this.gameOverContent = document.getElementById('gameOverContent');
    this.newHighScore = document.getElementById('newHighScore');
    this.actionText = document.getElementById('actionText');

    this.muteButton = document.getElementById('muteButton');
    this.bgMusic = document.getElementById('bgMusic');
    this.jumpSound = document.getElementById('jumpSound');
    this.gameOverSound = document.getElementById('gameOverSound');
    this.isMuted = false;

    this.usernameForm = document.getElementById('usernameForm');
    this.scoresList = document.getElementById('scoresList');
    this.usernameInput = document.getElementById('username');
    this.captchaCheckbox = document.getElementById('captchaCheckbox');
    this.errorMessage = document.getElementById('errorMessage');
    this.leaderboard = [];

    this.init();
  }

  init() {
    this.updateScoreDisplay();
    this.setupEventListeners();
    this.updateActionText();
    this.updateMuteState();
    this.initClouds();
    this.fetchTopScores();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleAction();
      }
    });

    this.gameContainer.addEventListener('click', () => this.handleAction());
    this.gameContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleAction();
    });

    this.muteButton.addEventListener('click', () => this.toggleMute());
    this.muteButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.toggleMute();
    });

    this.usernameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = this.usernameInput.value.trim();
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        this.errorMessage.textContent = "Only alphanumeric characters are allowed.";
        return;
      }
      if (!this.captchaCheckbox.checked) {
        this.errorMessage.textContent = "Please confirm you're not a robot.";
        return;
      }

      try {
        const response = await fetch('https://r-finance.xyz/raccoon-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation SubmitScore($username: String!, $score: Int!) {
              submitScore(username: $username, score: $score) { id }
            }`,
            variables: { username, score: this.score }
          })
        });

        const result = await response.json();
        if (result.errors) throw new Error('Submission failed');

        this.fetchTopScores(); // refresh after submission
        this.errorMessage.textContent = "";
      } catch {
        this.errorMessage.textContent = "Failed to submit score.";
      }

      this.usernameInput.value = '';
      this.captchaCheckbox.checked = false;
    });
  }

  async fetchTopScores() {
    try {
      const response = await fetch('https://r-finance.xyz/raccoon-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              topScores(limit: 10) {
                username
                score
              }
            }
          `
        })
      });

      const result = await response.json();
      if (result.data && result.data.topScores) {
        this.leaderboard = result.data.topScores;
        this.refreshLeaderboardUI();
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateMuteState();
    this.muteButton.textContent = this.isMuted ? '🔇' : '🔊';
  }

  handleAction() {
    if (this.gameState === 'waiting' || this.gameState === 'gameOver') {
      this.startGame();
    } else if (this.gameState === 'playing') {
      this.jump();
    }
  }

  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.obstacles = [];
    this.clouds = [];
    this.isJumping = false;
    this.lastObstacleTime = 0;
    this.lastCloudTime = 0;
    this.gameSpeed = 2;

    this.startScreen.classList.add('hidden');
    this.gameOverContent.style.display = 'none';

    this.ground.classList.add('moving');
    this.raccoon.classList.add('running');
    this.obstaclesContainer.innerHTML = '';
    this.cloudsContainer.innerHTML = '';
    this.initClouds();

    try {
      if (!this.isMuted) this.bgMusic.play();
    } catch (e) {
      console.warn('Audio play was blocked:', e);
    }

    this.startGameLoop();
    this.startScoreCounter();
    this.updateScoreDisplay();
  }

  jump() {
    if (!this.isJumping && this.gameState === 'playing') {
      this.isJumping = true;
      this.raccoon.classList.add('jumping');
      if (!this.isMuted) {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play();
      }

      setTimeout(() => {
        this.isJumping = false;
        this.raccoon.classList.remove('jumping');
      }, 600);
    }
  }

  endGame() {
    this.gameState = 'gameOver';
    this.ground.classList.remove('moving');
    this.raccoon.classList.remove('running');

    this.stopGameLoop();
    this.stopScoreCounter();

    if (!this.isMuted) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
      this.gameOverSound.play();
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('raccoon-high-score', this.highScore.toString());
      this.newHighScore.style.display = 'block';
    } else {
      this.newHighScore.style.display = 'none';
    }

    this.finalScoreEl.textContent = this.score;
    this.gameOverContent.style.display = 'block';
    this.updateActionText();
    this.startScreen.classList.remove('hidden');
    this.updateScoreDisplay();
  }

  startGameLoop() {
    const loop = () => {
      if (this.gameState !== 'playing') return;

      const now = Date.now();
      if (now - this.lastObstacleTime > 1500 + Math.random() * 1000) {
        this.addObstacle();
        this.lastObstacleTime = now;
      }

      if (now - this.lastCloudTime > 2000) {
        this.addClouds();
        this.lastCloudTime = now;
      }

      this.updateObstacles();
      this.updateClouds();
      this.checkCollisions();

      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  stopGameLoop() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }

  startScoreCounter() {
    this.scoreInterval = setInterval(() => {
      if (this.gameState === 'playing') {
        this.score++;
        if (this.score % 100 === 0) {
          this.gameSpeed = Math.min(this.gameSpeed + 0.5, 8);
        }
        this.updateScoreDisplay();
      }
    }, 100);
  }

  stopScoreCounter() {
    if (this.scoreInterval) {
      clearInterval(this.scoreInterval);
      this.scoreInterval = null;
    }
  }

  addObstacle() {
    const obstacle = document.createElement('div');
    obstacle.className = 'trash-can moving';
    obstacle.innerHTML = '🗑️';
    obstacle.style.left = window.innerWidth + 'px';
    obstacle.style.animationDuration = `${3 / this.gameSpeed}s`;

    this.obstaclesContainer.appendChild(obstacle);
    this.obstacles.push({ element: obstacle, x: window.innerWidth });
  }

  updateObstacles() {
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= this.gameSpeed;
      obstacle.element.style.left = obstacle.x + 'px';
      if (obstacle.x < -100) {
        obstacle.element.remove();
        return false;
      }
      return true;
    });
  }

  addClouds() {
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud moving';
      cloud.textContent = '☁️';
      cloud.style.left = window.innerWidth + i * 80 + 'px';
      cloud.style.top = Math.random() * 80 + 'px';
      this.cloudsContainer.appendChild(cloud);
      this.clouds.push({ element: cloud, x: window.innerWidth + i * 80 });
    }
  }

  updateClouds() {
    this.clouds = this.clouds.filter(cloud => {
      cloud.x -= 0.6;
      cloud.element.style.left = cloud.x + 'px';
      if (cloud.x < -100) {
        cloud.element.remove();
        return false;
      }
      return true;
    });
  }

  checkCollisions() {
    if (this.isJumping) return;
    const raccoonRect = this.raccoon.getBoundingClientRect();
    for (let obstacle of this.obstacles) {
      const rect = obstacle.element.getBoundingClientRect();
      const hit =
        raccoonRect.right > rect.left &&
        raccoonRect.left < rect.right &&
        raccoonRect.bottom > rect.top;
      if (hit) {
        this.endGame();
        return;
      }
    }
  }

  updateScoreDisplay() {
    this.currentScoreEl.textContent = this.score.toString().padStart(5, '0');
    this.highScoreEl.textContent = this.highScore.toString().padStart(5, '0');
  }

  updateActionText() {
    const action = this.gameState === 'waiting' ? 'Start' : 'Restart';
    this.actionText.textContent = action;
  }

  updateMuteState() {
    [this.bgMusic, this.jumpSound, this.gameOverSound].forEach(audio => {
      audio.muted = this.isMuted;
    });
  }

  refreshLeaderboardUI() {
    this.scoresList.innerHTML = '';
    this.leaderboard.forEach((entry, i) => {
      const li = document.createElement('li');
      li.textContent = `#${i + 1} ${entry.username}: ${entry.score}`;
      this.scoresList.appendChild(li);
    });
  }

  initClouds() {
    this.addClouds();
  }
}

// Init on DOM loaded
document.addEventListener('DOMContentLoaded', () => new RaccoonRunGame());
