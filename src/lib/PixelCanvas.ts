import {Vector2D} from "$lib/Vector2D";
import numberBitmaps from "$lib/bitmaps/numbers";
import letterBitmaps from "$lib/bitmaps/letters";

export class PixelMouseEvent {
    readonly position: Vector2D;

    constructor(position: Vector2D) {
        this.position = position;
    }
}

export class PixelCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private originRawPixels: Vector2D;
    readonly size: Vector2D;
    readonly pixelScale: number;
    private mousePos_: Vector2D|null = null;
    private lastMousePos_: Vector2D|null = null;
    private registeredMouseClickListeners: Set<(event: PixelMouseEvent) => void> = new Set();
    private registeredMouseDownListeners: Set<(event: PixelMouseEvent) => void> = new Set();
    private readonly mouseClickListener: (event: MouseEvent) => void = e => {
        this.registeredMouseClickListeners.forEach(l => l(new PixelMouseEvent(this.fromClientPos(Vector2D.from(e.clientX, e.clientY)))));
    };
    private readonly mouseDownListener: (event: MouseEvent) => void = e => {
        this.registeredMouseDownListeners.forEach(l => l(new PixelMouseEvent(this.fromClientPos(Vector2D.from(e.clientX, e.clientY)))));
    };
    private readonly updateMousePosListener: (e: MouseEvent) => void = e => {
        this.mousePos_ = this.lastMousePos_ = this.fromClientPos(Vector2D.from(e.clientX, e.clientY));
    }
    private readonly clearMousePosListener: (e: MouseEvent) => void = e => this.mousePos_ = null;


    constructor(canvas: HTMLCanvasElement, originRawPixels: Vector2D, size: Vector2D, pixelScale: number) {
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Could not get 2D canvas context');
        }
        this.ctx = ctx;
        this.canvas.addEventListener('click', this.mouseClickListener);
        this.canvas.addEventListener('mousedown', this.mouseDownListener);
        this.canvas.addEventListener('mouseenter', this.updateMousePosListener);
        this.canvas.addEventListener('mouseleave', this.clearMousePosListener);
        this.canvas.addEventListener('mousemove', this.updateMousePosListener);
        this.originRawPixels = originRawPixels;
        this.size = size;
        this.pixelScale = pixelScale;
    }

    destroy() {
        this.canvas.removeEventListener('click', this.mouseClickListener);
        this.canvas.removeEventListener('mousedown', this.mouseDownListener);
        this.canvas.removeEventListener('mouseenter', this.updateMousePosListener);
        this.canvas.removeEventListener('mouseleave', this.clearMousePosListener);
        this.canvas.removeEventListener('mousemove', this.updateMousePosListener);
        this.registeredMouseClickListeners.clear();
        this.registeredMouseDownListeners.clear();
    }

    private fromClientPos(pos: Vector2D): Vector2D {
        let canvasPos = this.canvas.getBoundingClientRect();
        return Vector2D.add(Vector2D.add(Vector2D.from(pos.x, pos.y), this.originRawPixels.negate(), Vector2D.from(-canvasPos.x, -canvasPos.y)).scale(1/this.pixelScale), Vector2D.from(-0.5, -0.5));

    }

    clear(color: string) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.originRawPixels.x, this.originRawPixels.y, this.size.x * this.pixelScale, this.size.y * this.pixelScale);
    }

    drawPixel(pixel: Vector2D, color: string) {
        this.ctx.fillStyle = color;
        if (pixel.x < 0 || pixel.x >= this.size.x || pixel.y < 0 || pixel.y >= this.size.y) {
            return;
        }
        this.ctx.fillRect(this.originRawPixels.x + Math.floor(pixel.x) * this.pixelScale, this.originRawPixels.y + Math.floor(pixel.y) * this.pixelScale, this.pixelScale, this.pixelScale);
    }

    private drawLineLow(x0: number, y0: number, x1: number, y1: number, color: string) {
        let dx = x1 - x0;
        let dy = y1 - y0;
        let yi = 1;
        if (dy < 0) {
            dy = -dy;
            yi = -1;
        }

        let D = 2*dy - dx;
        let y = y0;

        for (let x = x0; x <= x1; x++) {
            this.drawPixel(Vector2D.from(x, y), color);
            if (D > 0) {
                y += yi;
                D += 2*(dy - dx);
            } else {
                D += 2*dy;
            }
        }
    }
    private drawLineHigh(x0: number, y0: number, x1: number, y1: number, color: string) {
        let dx = x1 - x0;
        let dy = y1 - y0;
        let xi = 1;
        if (dx < 0) {
            dx = -dx;
            xi = -1;
        }

        let D = 2*dx - dy;
        let x = x0;

        for (let y = y0; y <= y1; y++) {
            this.drawPixel(Vector2D.from(x, y), color);
            if (D > 0) {
                x += xi;
                D += 2*(dx - dy);
            } else {
                D += 2*dx;
            }
        }
    }

    drawLine(a: Vector2D, b: Vector2D, color: string) {
        // Algorithm from https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm#All_cases
        if (Math.abs(b.y - a.y) < Math.abs(b.x - a.x)) {
            if (a.x > b.x) {
                this.drawLineLow(b.x, b.y, a.x, a.y, color);
            } else {
                this.drawLineLow(a.x, a.y, b.x, b.y, color);
            }
        } else {
            if (a.y > b.y) {
                this.drawLineHigh(b.x, b.y, a.x, a.y, color);
            } else {
                this.drawLineHigh(a.x, a.y, b.x, b.y, color);
            }
        }
    }

    fillRect(pos: Vector2D, size: Vector2D, color: string) {
        this.ctx.fillStyle = color;
        const posRawPixels = Vector2D.add(pos.scale(this.pixelScale), this.originRawPixels);
        const sizeRawPixels = size.scale(this.pixelScale);
        this.ctx.fillRect(posRawPixels.x, posRawPixels.y, sizeRawPixels.x, sizeRawPixels.y);
    }

    fillCircle(center: Vector2D, radius: number, color: string) {
        let minX = Math.floor(center.x - radius);
        let maxX = Math.ceil(center.x + radius);
        let minY = Math.floor(center.y - radius);
        let maxY = Math.ceil(center.y + radius);
        for (let x = minX; x <= maxX; x += 1) {
            for (let y = minY; y <= maxY; y += 1) {
                let currPos = new Vector2D(x, y);
                let dist = Vector2D.add(center, currPos.negate()).r();
                if (dist <= radius) {
                    this.drawPixel(currPos, color);
                }
            }
        }
    }

    drawBitmap(pos: Vector2D, matrix: (0|1)[][], color: string) {
        matrix.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel === 1) {
                    this.drawPixel(Vector2D.add(pos, Vector2D.from(x, y)), color);
                }
            });
        });
    }

    drawNumber(pos: Vector2D, char: string, color: string) {
        let bitmapSet = numberBitmaps.STYLISED;
        let bitmapIndex = char.charCodeAt(0) - "0".charCodeAt(0);
        this.drawBitmap(pos, bitmapSet[bitmapIndex], color);
    }

    drawChar(pos: Vector2D, char: string, color: string) {
        let bitmapSet = letterBitmaps.DEFAULT;
        let bitmapIndex = char.charCodeAt(0) - "a".charCodeAt(0);
        this.drawBitmap(pos, bitmapSet[bitmapIndex], color);
    }

    mousePos(): Vector2D|null {
        return this.mousePos_;
    }

    lastMousePos(): Vector2D|null {
        return this.lastMousePos_;
    }

    addClickListener(listener: (event: PixelMouseEvent) => void) {
        this.registeredMouseClickListeners.add(listener);
    }

    removeClickListener(listener: (event: PixelMouseEvent) => void) {
        this.registeredMouseClickListeners.delete(listener);
    }

    addMouseDownListener(listener: (event: PixelMouseEvent) => void) {
        this.registeredMouseDownListeners.add(listener);
    }

    removeMouseDownListener(listener: (event: PixelMouseEvent) => void) {
        this.registeredMouseDownListeners.delete(listener);
    }

    subCanvas(origin: Vector2D, size: Vector2D): PixelCanvas {
        return new PixelCanvas(this.canvas, Vector2D.add(this.originRawPixels, origin.scale(this.pixelScale)), size, this.pixelScale);
    }
}