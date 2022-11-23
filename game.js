class Game  {
    constructor() {
        this.ctx = null;
        this.platform = null;
        this.ball = null;
        this.blocks = [];
        this.cols = 8;
        this.rows = 4;
        this.sprites = {
            background: null,
            ball: null,
            platform: null,
            block: null
        };
        this.sounds = {
            bump: null
        }
        this.width = 640;
        this.height = 360;
        this.gameOver = false;
        this.score = 0;
    }

    init() {
        this.ctx = document.getElementById("mycanvas").getContext("2d");
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "20px Arial";
        this.setEvents();
    }

    setEvents() {
        window.addEventListener("keydown", (e) => {
            if (["ArrowLeft", "a", "d", "ArrowRight"].includes(e.key)) {
                this.platform.start(e.key);
            }
            if (e.key === ' ') {
                this.platform.fire();
            }
        });

        window.addEventListener("keyup", () => this.platform.stop());
    }

    preload(callback) {
        let loaded = 0;
        let required = Object.keys(this.sprites).length;
        required += Object.keys(this.sounds).length;
        const onResourceLoad = () => {
            ++loaded;

            if (loaded >= required) {
                callback();
            }
        };


        for (let key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = `img/${key}.png`;
            this.sprites[key].addEventListener("load", onResourceLoad);
        }
        for (let key in this.sounds) {
            this.sounds[key] = new Audio(`sounds/${key}.mp3`);
            this.sounds[key].addEventListener("canplaythrough", onResourceLoad, {once: true});
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const {background, ball, platform} = this.sprites;
        this.ctx.drawImage(background, 0, 0);
        this.ctx.drawImage(ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
        this.ctx.drawImage(platform, this.platform.x, this.platform.y);
        this.renderBlocks();
        this.ctx.fillText(`Score: ${this.score}`, 15, 20);
    }

    renderBlocks() {
        this.blocks.forEach(({height, width, x, y, active}) => 
           active && this.ctx.drawImage(this.sprites.block, 0, 0, width, height, x, y, width, height));
    }
    
    create() {
        this.blocks = new Array(this.rows * this.cols).fill({}).map((_, i) => {
                return {
                    width: 60,
                    height: 20,
                    x: 60 + 65 * (i % 8),
                    y: 20 + 25 * Math.floor(i/8),
                    active: true
                }
            }
        );
    }

    addSkore() {
        this.score += 1;
    }

    update() {
        this.platform.collide();
        this.platform.move();
        this.ball.move();
        this.blocks.forEach((block) => {
            if (this.ball.collide(block) && block.active) {
                this.ball.bumpBlock(block);
                this.addSkore();
                this.sounds.bump.play();
                if (this.score === this.blocks.length) {
                    this.end("You Win");
                };
            };
        });
        if (this.ball.collide(this.platform)) {
            this.ball.bumpPlatform(this.platform);
        }
        this.ball.bumpSides();
    }

    run() {
        window.requestAnimationFrame(() => {
            this.update();
            this.render();
            if (!this.gameOver) {
                this.run();
            }
        });
    }

    start() {
        this.init();
        this.preload(() => {
            this.create();
            this.run();
        });
    }

    random(min, max) {
        return Math.floor((Math.random() * (max - min + 1)) + min)}

    end(text) {
        this.gameOver = true;
        alert(text)
        location.reload();
    }

}

const game = new Game();

game.ball = {
    x: 320,
    y: 280,
    width: 20,
    height: 20,
    dy: 0,
    dx: 0,
    velocity: 3,
    frame: 0,
    start() {
        this.dy = -this.velocity;
        this.dx = game.random(-this.velocity, this.velocity);
        this.animate();
    },
    animate() {
        setInterval(() => {
            ++this.frame;
            if (this.frame > 3) {
                this.frame = 0;
            }
        }, 100);
    },
    move() {
        if (this.dy) {
            this.y += this.dy;
        }
        if (this.dx) {
            this.x += this.dx;
        }
    },
    collide(element) {
        let x = this.x + this.dx;
        let y = this.y + this.dy;
        

        if (x + this.width >= element.x &&
            x <= element.x + element.width &&
            y + this.height >= element.y &&
            y <= element.y + element.height) {
                return true;
        } else {
            return false;
        }
    },
    bumpBlock(block) {
            this.dy *= -1;
            block.active = false;
    },
    bumpPlatform(platform) {
        if (platform.dx) {
            this.x += platform.dx;
        }
        if (this.dy > 0) {
            game.sounds.bump.play();

            this.dy *= -1;
            let touchX = this.x + this.width / 2;
            let platformCenter = platform.x + platform.width / 2;
            let deflectionAngle = (touchX - platformCenter) * 0.02;
            this.dx = deflectionAngle * this.velocity;
        }
        
    },
    bumpSides() {
        let x = this.x + this.dx;
        let y = this.y + this.dy;
        if (x <= 0 || x + this.width >= game.width) {
            this.dx = -this.dx;
            game.sounds.bump.play();
        }
        if (y  <= 0) {
            this.dy = -this.dy;
            game.sounds.bump.play();

        }
        if (y > game.height) {
            game.end('Game Over!');
        }
    }
}

game.platform = {
    velocity: 6,
    dx: 0,
    x: 280,
    y: 300,
    width: 100,
    height: 14,
    ball: game.ball,
    fire() {
        if (this.ball) {
            this.ball.start();
            this.ball = null;
        }
    },
    move() {
        if (this.dx) {
            this.x += this.dx;
            if (this.ball) {
                game.ball.x = this.x + 40;
            }
        }
    },
    start(direction) {
        if (["ArrowLeft", "a"].includes(direction)) {
            this.dx = -this.velocity;
        } else if (["ArrowRight", "d"].includes(direction)) {
            this.dx = this.velocity;
        }
    },
    stop() {
        this.dx = 0;
    },
    collide() {
        let x = this.x + this.dx;

        if (x < 0 || x + this.width > game.width) {
            this.stop();
        }
    }
}


window.addEventListener("load", () => {
    game.start();
});