
import {Vector2D} from '$lib/Vector2D';
import type {GameConfig} from "$lib/Game";

export class Player {
    config: GameConfig;
    position: Vector2D;
    velocity: Vector2D = new Vector2D(0, 0);
    invulnerabilityUntil: number = 0;
    lastBlink: {
        t: number,
        angle: number,
        startPos: Vector2D,
        endPos: Vector2D,
    }|null = null;

    constructor(config: GameConfig, position: Vector2D) {
        this.config = config;
        this.position = position;
    }

    invulnerable(t: number) {
        return this.invulnerabilityUntil > t || this.inBlinkAnimation(t);
    }

    blinkOnCooldown(t: number) {
        return this.lastBlink !== null && this.lastBlink.t > t - this.config.blink.cooldown;
    }

    inBlinkAnimation(t: number) {
        return this.lastBlink !== null && this.lastBlink.t > t - this.config.blink.animationDuration;
    }
}