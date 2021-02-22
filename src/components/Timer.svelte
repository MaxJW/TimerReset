<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import firebase from "firebase/app";
    import { db } from "../firebase";
    import { time } from "../stores";
    import { padWithZeroes } from "../utils";

    const dispatch = createEventDispatcher();

    export let lastReset; //Get current time when starting/resuming timer
    export let timesReset;
    export let name;
    export let id;

    let timer = new Date();

    onMount(() => {
        timer = lastReset.toDate();
    });

    //Reset a timer to 0, and store time in leaderboard
    function resetTimer() {
        let newResetTime = firebase.firestore.Timestamp.fromDate(new Date());
        let resetIncrease = timesReset + 1;
        dispatch("reset", { id, newResetTime, resetIncrease });
    }

    const unsubscribe = db
        .collection("timers")
        .doc(id)
        .onSnapshot((doc) => {
            timer = doc.data().lastReset.toDate();
        });

    $: currTime = Math.floor(($time.getTime() - timer.getTime()) / 1000);
    $: hours = Math.floor(currTime / 3600);
    $: minutes = Math.floor(currTime / 60) - hours * 60; //Calculate number of minutes remaining
    $: seconds = Math.floor(currTime % 60); //Calculate number of seconds remaining (in current minute)

    onDestroy(unsubscribe);
</script>

<div class="timer">
    <span>{name}</span>
    {hours}:{padWithZeroes(minutes)}:{padWithZeroes(seconds)}
    <button type="button" on:click={resetTimer}>Reset</button>
</div>

<style>
    .timer {
        padding-bottom: 20px;
    }
</style>
