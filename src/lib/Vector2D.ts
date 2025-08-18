export class Vector2D {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static from(x: number, y: number): Vector2D {
        return new Vector2D(x, y);
    }

    static fromPolar(r: number, theta: number): Vector2D {
        return new Vector2D(r * Math.cos(theta), r * Math.sin(theta));
    }

    static add(...vecs: Vector2D[]): Vector2D {
        return new Vector2D(vecs.reduce((sum, vec) => sum + vec.x, 0), vecs.reduce((sum, vec) => sum + vec.y, 0));
    }

    theta(): number {
        return Math.atan2(this.y, this.x);
    }

    r(): number {
        return Math.hypot(this.x, this.y);
    }

    negate(): Vector2D {
        return new Vector2D(-this.x, -this.y);
    }

    scale(factor: number): Vector2D {
        return new Vector2D(this.x * factor, this.y * factor);
    }
}