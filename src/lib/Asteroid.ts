import {Vector2D} from "$lib/Vector2D";

function roundVector(vector: Vector2D): Vector2D {
    return new Vector2D(Math.round(vector.x), Math.round(vector.y));
}

export class Asteroid {
    size: number;
    private readonly renderOffset: Vector2D;
    position: Vector2D;
    velocity: Vector2D;

    constructor(size: number, position: Vector2D, velocity: Vector2D) {
        this.size = size;
        this.position = position;
        this.renderOffset = Vector2D.add(this.position, roundVector(this.position).negate());
        this.velocity = velocity;
    }

    renderPosition(): Vector2D {
        return Vector2D.add(roundVector(this.position), this.renderOffset);
    }
}