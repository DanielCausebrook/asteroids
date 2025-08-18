import {Vector2D} from "$lib/Vector2D";
import {PixelCanvas} from "$lib/PixelCanvas";
import {Player} from "$lib/Player";
import {Asteroid} from "$lib/Asteroid";
import {delayMs} from "$lib/utils";

export type GameConfig = {
    fps: number,
    playAreaSize: Vector2D,
    pixelScale: number,
    mousePull: number,
    asteroid: {
        spawnFreq: number,
        sizeMin: number,
        sizeMax: number,
        velMin: number,
        velMax: number,
    },
    playerHit: {
        flashFreq: number,
        flashDuration: number,
        respawnTime: number,
        invulnerabilityDuration: number,
        invulnerabilityFlashFreq: number,
    },
    colors: {
        fg: string,
        bg: string,
    }
};

export class Game {
    private canvas: HTMLCanvasElement;
    private config: GameConfig;
    private pixelCanvas: PixelCanvas;
    private instance: GameInstance|null = null;

    constructor(canvas: HTMLCanvasElement, config: GameConfig) {
        this.canvas = canvas;

        let canvasSize = GameInstance.computeCanvasSize(config);
        const canvasSizeRawPixels = canvasSize.scale(config.pixelScale);
        canvas.width = canvasSizeRawPixels.x;
        canvas.height = canvasSizeRawPixels.y;
        this.config = config;
        this.pixelCanvas = new PixelCanvas(this.canvas, new Vector2D(0, 0), canvasSize, this.config.pixelScale);
    }

    destroy() {
        if (this.instance !== null) {
            this.instance.destroy();
            this.instance = null;
        }
        this.pixelCanvas.destroy();
    }

    run() {
        if (this.instance === null) {
            this.instance = new GameInstance(this.pixelCanvas, this.config);
            this.instance.run();
        }
    }

}

const HUD_HEIGHT = 9;

class GameInstance {
    private config: GameConfig;
    private canvas: PixelCanvas;
    private playAreaCanvas: PixelCanvas;
    private player: Player;
    private score = 0;
    private asteroids: Asteroid[] = [];
    private nextAsteroidIn = 0;
    private playerHitAt: number|null = null;
    private playerSpawnAt: number = 0;
    private running = false;

    constructor(canvas: PixelCanvas, config: GameConfig) {
        this.config = config;
        this.canvas = canvas;
        this.playAreaCanvas = canvas.subCanvas(new Vector2D(1, 1), config.playAreaSize);
        this.player = new Player(config.playAreaSize.scale(0.5));
    }

    static computeCanvasSize(config: GameConfig): Vector2D {
        return Vector2D.from(config.playAreaSize.x + 2, config.playAreaSize.y + 2 + HUD_HEIGHT);
    }

    destroy() {
        this.running = false;
        this.playAreaCanvas.destroy();
        this.canvas.destroy();
    }

    async run() {
        this.running = true;

        let startMs = new Date().getTime();
        let lastT = 0;
        while(this.running) {
            const t = (new Date().getTime() - startMs) / 1000;
            const delta = t - lastT;
            lastT = t;

            this.gameLoop(t, delta);

            await delayMs(1000 / this.config.fps);
        }
    }

    gameLoop(t: number, delta: number) {
        let player = this.player;
        let playAreaSize = this.config.playAreaSize;
        let white = this.config.colors.fg;
        let black = this.config.colors.bg;

        // Move player
        if (this.playerHitAt === null) {
            let lastMousePos = this.playAreaCanvas.lastMousePos();
            if (lastMousePos !== null) {
                let vecToMouse = Vector2D.add(lastMousePos, player.position.negate());
                player.velocity = Vector2D.add(player.velocity, vecToMouse.scale(this.config.mousePull));
            }
            player.position = Vector2D.add(player.position, player.velocity.scale(delta));

            if (player.position.x < 0) {
                player.position = new Vector2D(0, player.position.y);
                if (player.velocity.x < 0) {
                    player.velocity = new Vector2D(player.velocity.x * -0.5, player.velocity.y);
                }
            } else if (player.position.x >= playAreaSize.x) {
                player.position = new Vector2D(playAreaSize.x, player.position.y);
                if (player.velocity.x > 0) {
                    player.velocity = new Vector2D(player.velocity.x * -0.5, player.velocity.y);
                }
            }

            if (player.position.y < 0) {
                player.position = new Vector2D(player.position.x, 0);
                if (player.velocity.y < 0) {
                    player.velocity = new Vector2D(player.velocity.x, player.velocity.y * -0.5);
                }
            } else if (player.position.y >= playAreaSize.y) {
                player.position = new Vector2D(player.position.x, playAreaSize.y);
                if (player.velocity.y > 0) {
                    player.velocity = new Vector2D(player.velocity.x, player.velocity.y * -0.5);
                }
            }
        } else if (this.playerHitAt + this.config.playerHit.respawnTime < t) {
            player.position = this.playAreaCanvas.lastMousePos() ?? this.playAreaCanvas.size.scale(0.5);
            player.velocity = Vector2D.from(0, 0);
            this.playerHitAt = null;
            this.playerSpawnAt = t;
            this.asteroids = [];
        }

        // Spawn asteroids
        this.nextAsteroidIn -= delta;
        while (this.nextAsteroidIn <= 0) {
            const theta = Math.random() * Math.PI * 2;
            const spawnPos = Vector2D.add(Vector2D.fromPolar(Math.max(playAreaSize.x, playAreaSize.y), theta), playAreaSize.scale(0.5));
            const spawnVel = Vector2D.fromPolar(this.config.asteroid.velMin + Math.random() * (this.config.asteroid.velMax - this.config.asteroid.velMin), theta + 0.75*Math.PI + 0.5*Math.PI*Math.random());
            this.asteroids.push(new Asteroid(this.config.asteroid.sizeMin + Math.random() * (this.config.asteroid.sizeMax - this.config.asteroid.sizeMin) ,spawnPos, spawnVel));

            this.nextAsteroidIn += this.config.asteroid.spawnFreq;
        }

        // Move asteroids
        for (const asteroid of this.asteroids) {
            asteroid.position = Vector2D.add(asteroid.position, asteroid.velocity.scale(delta));
        }
        this.asteroids = this.asteroids.filter(asteroid => {
            if (asteroid.position.x < -asteroid.size && asteroid.velocity.x < 0) {
                return false;
            } else if (asteroid.position.x >= playAreaSize.x + asteroid.size && asteroid.velocity.x > 0) {
                return false;
            }
            if (asteroid.position.y < - asteroid.size && asteroid.velocity.y < 0) {
                return false;
            } else if (asteroid.position.y >= playAreaSize.y + asteroid.size && asteroid.velocity.y > 0) {
                return false;
            }
            return true;
        });

        // Detect collisions
        if (!player.invulnerable(t)) {
            for (const asteroid of this.asteroids) {
                if (!(player.position.x > asteroid.position.x - 0.5*asteroid.size && player.position.x < asteroid.position.x + 0.5*asteroid.size && player.position.y > asteroid.position.y - 0.5*asteroid.size && player.position.y < asteroid.position.y + 0.5*asteroid.size)) {
                    continue;
                }
                let dist = Vector2D.add(player.position, asteroid.position.negate()).r();
                if (dist < 0.5*asteroid.size) {
                    this.playerHitAt = t;
                    player.invulnerabilityUntil = t + this.config.playerHit.respawnTime + this.config.playerHit.invulnerabilityDuration;
                }
            }
        }

        // Scoring
        if (this.playerHitAt !== null) {
            this.score = this.playerHitAt - this.playerSpawnAt;
        } else {
            this.score = t - this.playerSpawnAt;
        }


        // Rendering
        const shouldFlashBgFn = () => {
            if (this.playerHitAt !== null) {
                const timeSinceHit = t - this.playerHitAt;

                if (timeSinceHit < this.config.playerHit.flashDuration && timeSinceHit % this.config.playerHit.flashFreq < 0.5*this.config.playerHit.flashFreq) {
                    return true;
                }
            }
            return false;
        }
        this.playAreaCanvas.clear(shouldFlashBgFn() ? white : black)

        for (const asteroid of this.asteroids) {
            this.playAreaCanvas.fillCircle(asteroid.renderPosition(), asteroid.size / 2, white);
        }

        const shouldHidePlayerFn = () => {
            if (this.playerHitAt !== null) {
                return true
            }
            if (player.invulnerable(t) && (player.invulnerabilityUntil - t) % this.config.playerHit.invulnerabilityFlashFreq < 0.5*this.config.playerHit.invulnerabilityFlashFreq) {
                return true;
            }
            return false;
        }
        if (!shouldHidePlayerFn()) {
            const playerRenderPos = Vector2D.from(
                player.position.x == this.config.playAreaSize.x ? this.config.playAreaSize.x - 1 : player.position.x,
                player.position.y == this.config.playAreaSize.y ? this.config.playAreaSize.y - 1 : player.position.y,
            );
            this.playAreaCanvas.drawPixel(playerRenderPos, white);
        }

        this.paintHUD();
    }

    paintHUD() {
        let white = this.config.colors.fg;
        let black = this.config.colors.bg;

        // Game border
        let borderH = this.config.playAreaSize.y + 1;
        let borderW = this.config.playAreaSize.x + 1;
        this.canvas.drawLine(Vector2D.from(0, 0), Vector2D.from(0, borderH), white);
        this.canvas.drawLine(Vector2D.from(0, borderH), Vector2D.from(borderW, borderH), white);
        this.canvas.drawLine(Vector2D.from(0, 0), Vector2D.from(borderW, 0), white);
        this.canvas.drawLine(Vector2D.from(borderW, 0), Vector2D.from(borderW, borderH), white);

        // Game HUD
        let hudPos = Vector2D.from(0, borderH + 1);
        let hudSize = Vector2D.from(borderW, HUD_HEIGHT);
        const hudFG = white;
        const hudBG = black;
        this.canvas.fillRect(hudPos, hudSize, hudBG);

        // Score
        const NUM_CHARS = 7;
        const LEADING_DOTS = false;
        const scorePos = Vector2D.add(hudPos, Vector2D.from(hudSize.x - 4*NUM_CHARS - 3, 2)); // Height: 5
        const scoreStr = (Math.round(this.score*10)).toString().padStart(NUM_CHARS - 1, '0');
        let leadingZeroes = true;
        for (let i = 0; i < NUM_CHARS - 1; i++) {
            if (leadingZeroes && i < NUM_CHARS - 3 && scoreStr.charAt(i) === '0') {
                if (LEADING_DOTS) {
                    this.canvas.drawPixel(Vector2D.add(scorePos, Vector2D.from(4*i + 1, 2)), hudFG);
                }
                continue;
            }
            leadingZeroes = false;
            if (i === NUM_CHARS - 2) {
                // this.canvas.drawChar(Vector2D.add(scorePos, Vector2D.from(4*i, 0)), '.', black);
                this.canvas.drawPixel(Vector2D.add(scorePos, Vector2D.from(4*i, 4)), hudFG);
                this.canvas.drawNumber(Vector2D.add(scorePos, Vector2D.from(4*i + 2, 0)), scoreStr.charAt(i), hudFG)
            } else {
                this.canvas.drawNumber(Vector2D.add(scorePos, Vector2D.from(4*i, 0)), scoreStr.charAt(i), hudFG)
            }
        }
    }
}