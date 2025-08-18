<script lang=ts>
    import {onMount} from "svelte";
    import {Vector2D} from "$lib/Vector2D";
    import {Game, type GameConfig} from "$lib/Game";
    import {PixelCanvas} from "$lib/PixelCanvas";
    import checkboxBitmaps from "$lib/bitmaps/checkbox";

    let canvas: HTMLCanvasElement;
    let configCanvas: HTMLCanvasElement;
    let configPixelCanvas: PixelCanvas;
    let config: GameConfig = {
        fps: 30,
        playAreaSize: new Vector2D(100, 100),
        pixelScale: 6,
        mousePull: 0.1,
        asteroid: {
            spawnFreq: 0.3,
            sizeMin: 8,
            sizeMax: 25,
            velMin: 5,
            velMax: 20,
        },
        playerHit: {
            flashFreq: 0.1,
            flashDuration: 0.5,
            respawnTime: 2,
            invulnerabilityDuration: 2,
            invulnerabilityFlashFreq: 0.2,
        },
        colors: {
            bg: '#000',
            fg: '#fff',
        }
    };

    let showConfig = $state(false);

    let colorBlindMode = $state(false);
    $effect(() => {
        config.colors.fg = colorBlindMode ? 'red' : '#fff';
        config.colors.bg = colorBlindMode ? 'green' : '#000';
        drawConfig();
    });
    let configText = 'colour blind mode';

    function drawConfig() {
        if (configPixelCanvas !== undefined) {
            configPixelCanvas.fillRect(Vector2D.from(0, 0), configPixelCanvas.size, config.colors.bg);
            for(let i = 0; i < configText.length; i++) {
                const char = configText.charAt(i);
                if (char !== " ") {
                    configPixelCanvas.drawChar(Vector2D.from(9 + 4 + 5*i, 1), configText.charAt(i), config.colors.fg);
                }
            }
            configPixelCanvas.drawBitmap(Vector2D.from(4, 1), checkboxBitmaps[colorBlindMode ? 1 : 0], config.colors.fg);
        }
    }

    onMount(() => {
        const configCanvasWidth = 5*configText.length + 9 + 4;
        configPixelCanvas = new PixelCanvas(configCanvas, Vector2D.from(0, 0), Vector2D.from(configCanvasWidth, 7), config.pixelScale);
        configCanvas.width = configCanvasWidth * config.pixelScale;
        configCanvas.height = 8 * config.pixelScale;
        drawConfig();

        const game = new Game(canvas, config);
        game.run();

        let showConfigListener = (e: KeyboardEvent) => {
            if (e.key === "m") {
                showConfig = !showConfig;
            }
        }
        document.addEventListener('keypress', showConfigListener);

        return () => {
            game.destroy();
            document.removeEventListener('keypress', showConfigListener);
        }
    })
</script>

<main class:color-blind-mode={colorBlindMode}>
    <div class="wrapper">
        <canvas bind:this={canvas}></canvas>
        <canvas bind:this={configCanvas} class="config" class:show={showConfig} onclick={() => colorBlindMode = !colorBlindMode}></canvas>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        justify-content: center;
        background: black;
        color: white;
        height: 100%;
        overflow: hidden;

        &.color-blind-mode {
            color: red;
            background: green;
        }
    }
    .wrapper {
        flex: 0 1 auto;
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
        gap: 20px;
        max-height: 100%;
    }
    .config {
        cursor: pointer;
        &:not(.show) {
            opacity: 0;
            pointer-events: none;
        }
    }

</style>