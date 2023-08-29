window.addEventListener('load', () => {
  const music = document.querySelector('#gameMusic');
  const scoreSound = document.querySelector('#scoreSound');
  const canvas = document.querySelector('#canvas1');
  const fullscreenButton = document.querySelector('#fullScreenButton');
  const ctx = canvas.getContext('2d');
  canvas.width = 1500;
  canvas.height = 720;
  const keys = {
    ArrowDown: true,
    ArrowUp: true,
    ArrowLeft: true,
    ArrowRight: true,
    ' ': true,
  };
  let gameFrame = 0;
  let enemies = [];
  let score = 0;
  let gameOver = false;

  class InputHandler {
    constructor() {
      this.keys = [];
      this.touchY = '';
      this.touchTreshold = 30;
      window.addEventListener('keydown', ({ key }) => {
        if (keys.hasOwnProperty(key) && !this.keys.includes(key)) {
          this.keys.push(key);
        } else if (key === 'Enter' && gameOver) {
          resetGame();
        } else if (key === 'f') {
          toggleFullscreen();
        }
      });

      window.addEventListener('keyup', ({ key }) => {
        if (keys.hasOwnProperty(key))
          this.keys.splice(this.keys.indexOf(key), 1);
      });

      window.addEventListener('touchstart', (e) => {
        this.touchY = e.changedTouches[0].pageY;
      });

      window.addEventListener('touchmove', (e) => {
        const swipeDistance = e.changedTouches[0].pageY - this.touchY;

        if (swipeDistance < -this.touchTreshold && !this.includes('swipe up')) {
          this.keys.push('swipe up');
        } else if (
          swipeDistance > this.touchTreshold * 5 &&
          !this.includes('swipe down')
        ) {
          this.keys.push('swipe down');
        }

        if (this.includes('swipe down') && gameOver) resetGame();
      });

      window.addEventListener('touchend', (e) => {
        this.keys.splice(this.keys.indexOf('swipe up', 0));
        this.keys.splice(this.keys.indexOf('swipe down', 0));
      });
    }

    includes(key) {
      return this.keys.includes(key);
    }

    restart() {
      this.keys = [];
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.x = 100;
      this.y = this.gameHeight - this.height - 20;
      this.image = document.querySelector('#player');
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 8;
      this.speed = 0;
      this.vy = 0;
      this.gravity = 0.5;
      this.fps = 20;
      this.animationInterval = 1000 / this.fps;
      this.frameTimer = 0;
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(input, deltaTime, enemies) {
      enemies.forEach((enemy) => {
        let dx = enemy.x + enemy.width / 2 - 30 - (this.x + this.width / 2);
        let dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2 + 20);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.width / 3 + this.width / 3) gameOver = true;
      });

      if (input.includes('ArrowRight')) {
        this.speed = 5;
      } else if (input.includes('ArrowLeft')) {
        this.speed = -5;
      } else {
        this.speed = 0;
      }

      if (this.x < 0) this.x = 0;
      if (this.x > this.gameWidth - this.width) {
        this.x = this.gameWidth - this.width;
      }

      this.x += this.speed;

      if (
        (input.includes('ArrowUp') ||
          input.includes('swipe up') ||
          input.includes(' ')) &&
        this.onGround()
      ) {
        this.vy = -20;
        this.frameY = 1;
      }

      this.y += this.vy;

      if (!this.onGround()) {
        this.vy += this.gravity;
        this.maxFrame = 6;
      } else {
        this.vy = 0;
        this.frameY = 0;
        this.maxFrame = 8;
      }

      if (this.y < 20) this.y = 20;
      if (this.y > this.gameHeight - this.height - 20) {
        this.y = this.gameHeight - this.height - 20;
      }

      this.frameTimer += deltaTime;

      if (this.frameTimer > this.animationInterval) {
        this.frameX++;
        this.frameTimer = 0;
      }

      if (this.frameX > this.maxFrame) this.frameX = 0;
    }

    onGround() {
      return this.y === this.gameHeight - this.height - 20;
    }

    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.frameY = 0;
      this.frameX = 0;
      this.maxFrame = 8;
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameHeight = gameHeight;
      this.gameWidth = gameWidth;
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.height = 720;
      this.image = document.querySelector('#background');
      this.speed = 3;
      this.fps = 200;
      this.animationInterval = 1000 / this.fps;
      this.frameTimer = 0;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.width + this.x - this.speed,
        this.y,
        this.width,
        this.height
      );

      context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update(deltaTime) {
      if (this.x < 0 - this.width) this.x = 0;

      this.frameTimer += deltaTime;
      if (this.frameTimer > this.animationInterval) {
        this.x -= this.speed;
        this.frameTimer = 0;
      }
    }

    restart() {
      this.x = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height - 20;
      this.image = document.querySelector('#enemy');
      this.frame = 0;
      this.maxFrame = 5;
      this.speed = 5;
      this.fps = 20;
      this.animationInterval = 1000 / this.fps;
      this.frameTimer = 0;
      this.markedForDeletion = false;
    }

    update(deltaTime) {
      this.x -= this.speed;

      if (this.x < -this.width) {
        this.markedForDeletion = true;
        score++;
        scoreSound.currentTime = 0;
        scoreSound.play();
      }

      this.frameTimer += deltaTime;

      if (this.frameTimer > this.animationInterval) {
        this.frame++;
        this.frameTimer = 0;
      }

      if (this.frame > this.maxFrame) this.frame = 0;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.width * this.frame,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  function handleEnemies(deltaTime) {
    enemyTimer += deltaTime;

    if (enemyTimer > enemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
      enemyInterval = Math.random() * 1100 + 200;
    }

    enemies.forEach((enemy) => {
      enemy.update(deltaTime);
      enemy.draw(ctx);
    });

    enemies = enemies.filter((enemy) => !enemy.markedForDeletion);
  }

  function displayStatusText(context) {
    context.textAlign = 'left';
    context.font = ' bold 35px Helvetica';
    context.fillStyle = '#222';
    context.fillText('Score: ' + score, 10, 50);
    context.fillStyle = '#fff';
    context.fillText('Score: ' + score, 12, 52);
  }

  function resetGame() {
    player.restart();
    background.restart();
    input.restart();
    enemies = [];
    gameOver = false;
    score = 0;
    enemyTimer = 0;
    animate();
    startMusic();
  }

  function drawGameOver(context) {
    context.textAlign = 'center';
    context.font = ' bold 40px Helvetica';
    context.fillStyle = '#222';
    context.fillText(
      'Game Over press Enter or Swipe Domn to restart',
      canvas.width / 2,
      canvas.height / 4
    );
    context.fillStyle = '#fff';
    context.fillText(
      'Game Over press Enter or Swipe Down to restart',
      canvas.width / 2 + 2,
      canvas.height / 4 + 2
    );
  }

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background();

  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = Math.random() * 1100 + 200;

  function animate(timeStamp = 0) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update(deltaTime);
    background.draw(ctx);
    player.update(input, deltaTime, enemies);
    player.draw(ctx);
    handleEnemies(deltaTime);
    displayStatusText(ctx);

    gameFrame++;

    if (!gameOver) requestAnimationFrame(animate);
    else {
      drawGameOver(ctx);
      stopMusic();
    }
  }

  fullscreenButton.addEventListener('click', toggleFullscreen);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch((err) => {
        alert(`Error, can't anable fullscreen mode, ${err.message}`);
      });
      canvas.classList.remove('border');
    } else {
      document.exitFullscreen();
      canvas.classList.add('border');
    }
  }

  function startMusic() {
    music.volume = 0.2;
    music.currentTime = 0;
    music.play();

    music.addEventListener('ended', () => {
      music.play();
    });
  }

  function stopMusic() {
    music.pause();
    music.removeEventListener('ended');
  }

  startMusic();
  animate();
});
