<script>
    import { timeSince } from '../utils';
    export let leaderboard;

    let avgTimerLength = 0;
    let totalResets = 0;
    $: avgTimerLength = timeSince(leaderboard.reduce((a, b) => a + b.lrs, 0) / leaderboard.length);
    $: totalResets = leaderboard.reduce((a, b) => a + b.tr, 0);
</script>

<div id="totals">
    <div class="center-full">
        <span class="totals-header">Average Time Before Reset</span>
        <hr />
        <span class="totals-amount">{avgTimerLength}</span>
    </div>
    <div class="center-full end">
        <span class="totals-header">Total Timer Resets</span>
        <hr />
        <span class="totals-amount">{totalResets}</span>
    </div>
</div>

<style>
    #totals {
        display: flex;
        flex-direction: row;
        width: 100%;
    }

    #totals div {
        width: 100%;
        height: 100%;
        flex: 1;
    }

    .totals-header {
        font-size: 2rem;
        font-family: 'Roboto', sans-serif;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }

    .totals-amount {
        font-family: 'Roboto Mono', monospace;
        font-size: 1.5rem;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }

    hr {
        width: 75%;
    }

    @media (max-width: 545px) {
        #totals {
            flex-direction: column;
        }
        #totals div {
            margin-top: 2rem;
        }
        .end {
            margin-bottom: 2rem;
        }
    }
</style>
