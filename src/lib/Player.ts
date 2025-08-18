
import {Vector2D} from '$lib/Vector2D';

export class Player {
    position: Vector2D;
    velocity: Vector2D;
    invulnerabilityUntil: number = 0;

    constructor(position: Vector2D) {
        this.position = position;
        this.velocity = new Vector2D(0, 0);
    }

    invulnerable(time: number) {
        return this.invulnerabilityUntil > time;
    }
}