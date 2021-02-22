<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import firebase from "firebase/app";
    import { db } from "../firebase";
    import { time } from "../stores";
    import { padWithZeroes } from "../utils";

    const dispatch = createEventDispatcher();

    export let lastReset; //Get current time when starting/resuming timer
    export let timesReset;
    export let longestResetSeconds;
    export let name;
    export let id;

    let timer;

    onMount(() => {
        timer = lastReset.toDate();
    });

    //Reset a timer to 0, and store time in leaderboard
    function resetTimer() {
        if (!confirm("Are you sure you want to reset " + name + "'s timer?")) {
            return;
        }
        let newResetTime = firebase.firestore.Timestamp.fromDate(new Date());
        let resetIncrease = timesReset + 1;
        let secondsSinceReset = currTime > longestResetSeconds ? currTime : 0;
        dispatch("reset", {
            id,
            newResetTime,
            resetIncrease,
            secondsSinceReset,
        });
    }

    const unsubscribe = db
        .collection("timers")
        .doc(id)
        .onSnapshot((doc) => {
            timer = doc.data().lastReset.toDate();
        });

    $: currTime =
        timer != null
            ? Math.floor(($time.getTime() - timer.getTime()) / 1000)
            : 0;
    $: hours = Math.floor(currTime / 3600);
    $: minutes = Math.floor(currTime / 60) - hours * 60; //Calculate number of minutes remaining
    $: seconds = Math.floor(currTime % 60); //Calculate number of seconds remaining (in current minute)

    onDestroy(unsubscribe);
</script>

<div class="timer" style="--dpp: url(/images/{name}.png)">
    <span class="time-name hide">{name}</span>
    <span class="time-span pos-abs"
        >{hours}:{padWithZeroes(minutes)}:{padWithZeroes(seconds)}</span
    >
    <button class="hide" type="button" on:click={resetTimer}>Reset</button>
</div>

<style>
    .timer {
        background-image: linear-gradient(
                rgba(0, 0, 0, 0.3),
                rgba(0, 0, 0, 0.3)
            ),
            var(--dpp);
        background-size: 100% auto;
        background-repeat: no-repeat;
        background-position: center center;
        display: flex;
        flex-direction: column;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        justify-content: space-around;
        align-items: center;
        transition: background-size 0.5s ease;
    }

    .timer:hover {
        transition: background-size 0.5s ease;
        background-size: 125% auto;
    }

    .timer:hover .hide {
        visibility: visible;
        opacity: 1;
    }

    .hide {
        visibility: hidden;
        opacity: 0;
        transition: visibility 0.3s ease, opacity 0.3s ease;
    }

    .time-name {
        font-size: 2rem;
        font-family: "Righteous", cursive;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }

    .time-span {
        font-family: "Roboto Mono", monospace;
        font-size: 2.5rem;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }
</style>
