<script>
    import { fly } from 'svelte/transition';
    import { sineOut } from 'svelte/easing';
    import { onMount } from 'svelte';
    import { timeSince } from '../utils';

    export let leaderboard;
    let showPanel = false;
    let lrsShown = true;

    $: {
        leaderboard, lrsShown ? showLRS() : showTR();
    }

    onMount(() => {
        showLRS();
    });

    const togglePanel = () => (showPanel = !showPanel);
    function showLRS() {
        leaderboard.sort(function (a, b) {
            return b.lrs - a.lrs;
        });
        lrsShown = true;
    }
    function showTR() {
        leaderboard.sort(function (a, b) {
            return b.tr - a.tr;
        });
        lrsShown = false;
    }
</script>

<div id="leaderboard-panel" class="pos-fixed center-full">
    <div id="panel-open" class="center-full" class:open={showPanel} on:click={togglePanel}>
        <i class="fas fa-angle-left pos-abs" />
    </div>
    {#if showPanel}
        <div
            id="panel-list"
            transition:fly={{
                x: 310,
                opacity: 1,
                duration: 400,
                easing: sineOut,
            }}
        >
            <div id="leaderboard-tabs">
                <button on:click={showLRS} class:active={lrsShown}>Longest Running Timer</button>
                <button on:click={showTR} class:active={!lrsShown}>Times Reset</button>
            </div>
            {#each leaderboard as pos, i}
                {#if lrsShown}
                    <span>{i + 1}: {pos.n} - {timeSince(pos.lrs)}</span>
                {:else}
                    <span>{i + 1}: {pos.n} - {pos.tr}</span>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    #leaderboard-panel {
        right: 0;
        top: 0;
        height: 100%;
        z-index: 99;
    }

    #leaderboard-tabs {
        display: flex;
    }

    #leaderboard-tabs button {
        width: 100%;
        margin: 0px 10px 10px 10px;
        box-shadow: 0 0 0 1px #ffffff1c;
    }

    #panel-list {
        background-color: #161f27;
        position: fixed;
        height: 100%;
        width: 300px;
        right: 0;
        overflow-y: scroll;
        z-index: 5;
        display: flex;
        flex-direction: column;
        padding: 10px;
        padding-top: 30px;
        text-align: left;
    }

    #panel-open {
        padding-right: var(--body-padding);
        border-bottom-left-radius: 4em;
        border-top-left-radius: 4em;
        height: 4em;
        width: 1.5em;
        z-index: 99;
        background: #161f27;
        font-size: 1.5em;
        align-items: flex-end;
        position: fixed;
        right: 0;
        cursor: pointer;
        transition: right 390ms ease-out;
    }

    #panel-open:hover .fa-angle-left {
        margin-right: 5px;
    }

    #panel-open.open {
        right: 305px;
    }

    #panel-open.open .fa-angle-left {
        transform: rotate(180deg);
    }

    .fa-angle-left {
        transition: margin-right 100ms ease-out;
    }

    .active {
        box-shadow: 0 0 0 2px var(--focus) !important;
    }
</style>
