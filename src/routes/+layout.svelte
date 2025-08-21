<script lang="ts">
    import favicon16 from '$lib/assets/favicon-16.png';
    import favicon32 from '$lib/assets/favicon-32.png';
    import favicon64 from '$lib/assets/favicon-64.png';
    import favicon96 from '$lib/assets/favicon-96.png';
    import favicon128 from '$lib/assets/favicon-128.png';

	let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" type="image/png" href={favicon16} sizes="16x16">
    <link rel="icon" type="image/png" href={favicon32} sizes="32x32">
    <link rel="icon" type="image/png" href={favicon64} sizes="64x64">
    <link rel="icon" type="image/png" href={favicon96} sizes="96x96">
    <link rel="icon" type="image/png" href={favicon128} sizes="128x128">
    <title>Asteroids</title>
</svelte:head>

{@render children?.()}
