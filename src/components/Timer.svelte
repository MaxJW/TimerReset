<script>
    import { onMount } from "svelte";
    import { time } from "../stores.js";
    import { padWithZeroes } from "../utils.js";

    let start; //Get current time when starting/resuming timer

    onMount(() => {
        start = new Date(2021, 1, 20); //Get current timer
    });

    //Reset a timer to 0, and store time in leaderboard
    function resetTimer() {
        start = $time.getTime();
    }

    $: currTime = Math.floor(($time.getTime() - start) / 1000);
    $: hours = Math.floor(currTime / 3600);
    $: minutes = Math.floor(currTime / 60) - hours*60; //Calculate number of minutes remaining
    $: seconds = Math.floor(currTime % 60); //Calculate number of seconds remaining (in current minute)
</script>

<div id="pomodoro-timer" class="pos-abs center-full w-100 h-100">
    <div id="pomo-clock">{hours}:{padWithZeroes(minutes)}:{padWithZeroes(seconds)}</div>
    <div id="pomo-controls">
        <button type="button" on:click={resetTimer}>Reset</button>
    </div>
</div>