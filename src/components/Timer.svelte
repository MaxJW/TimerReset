<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import firebase from "firebase/app";
    import { db } from "../firebase.js";
    import { time } from "../stores";
    import { padWithZeroes } from "../utils";

    const dispatch = createEventDispatcher();

    export let lastReset; //Get current time when starting/resuming timer
    export let timesReset;
    export let longestResetSeconds;

    export let votingActive;
    export let yesVotes;
    export let noVotes;
    export let voteReason;

    export let name;
    export let id;

    let timer;
    let oldResetCount = 0;
    let resetter = false;
    let alert = new Audio("./reset.mp3");
    alert.volume = 0.5;
    let initial = true;
    let votingStarted = false;

    onMount(() => {
        timer = lastReset.toDate();
        oldResetCount = timesReset;
        initial = votingActive ? false : true;
    });

    function beginVoting() {
        if (
            !confirm(
                "Are you sure you want to vote for a reset on " +
                    name +
                    "'s timer?"
            )
        ) {
            return;
        }
        var reason = prompt(
            "Enter a reason for " + name + "'s reset",
            "LoL Rage"
        );
        if (reason != null) {
            votingStarted = true;
            dispatch("beginvote", { id, reason });
        }
    }

    function voteAlert() {
        alert.play();
        if (Notification.permission === "granted") {
            var newnotif = new Notification(
                "Voting for resetting " + name + "'s timer has started!"
            );
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    var newnotif = new Notification(
                        "Voting for resetting " + name + "'s timer has started!"
                    );
                }
            });
        }
        votingStarted = false;
    }

    function votingEndedAlert() {
        if (!initial) {
            alert.play();
            if (Notification.permission === "granted") {
                var newnotif = new Notification(
                    name + "'s timer was NOT reset"
                );
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(function (permission) {
                    if (permission === "granted") {
                        var newnotif = new Notification(
                            name + "'s timer was NOT reset"
                        );
                    }
                });
            }
        } else {
            initial = false;
        }
    }

    const addYesVote = () => dispatch("yesvote", id);
    const addNoVote = () => dispatch("novote", id);
    const endVote = () => dispatch("endvote", id);

    const reasonDisplay = () => window.alert(voteReason);

    //Reset a timer to 0, and store time in leaderboard
    function resetTimer() {
        let newResetTime = firebase.firestore.Timestamp.fromDate(new Date());
        let resetIncrease = timesReset + 1;
        let secondsSinceReset = currTime > longestResetSeconds ? currTime : 0;
        votingStarted = false;
        dispatch("reset", {
            id,
            newResetTime,
            resetIncrease,
            secondsSinceReset,
        });
    }

    function resetAlert() {
        resetter = true;
        alert.play();
        setTimeout(() => {
            resetter = false;
        }, 1000);

        if (Notification.permission === "granted") {
            var newnotif = new Notification(name + " had their timer reset!");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    var newnotif = new Notification(
                        name + " had their timer reset!"
                    );
                }
            });
        }
    }

    const unsubscribe = db
        .collection("timers")
        .doc(id)
        .onSnapshot((doc) => {
            if (votingActive && votingStarted) {
                voteAlert();
            } else if (votingActive) {
                if (yesVotes + noVotes == 6 || yesVotes >= 4 || noVotes >= 4) {
                    if (yesVotes >= 4) {
                        resetTimer();
                    } else {
                        endVote();
                    }
                }
            } else {
                if (timesReset > oldResetCount) {
                    oldResetCount = timesReset;
                    timer = doc.data().lastReset.toDate();
                    resetAlert();
                } else {
                    votingEndedAlert();
                }
            }
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

<div
    class="timer"
    style="--dpp: url(/images/{name}.png)"
    class:resetbs={resetter}
    class:resetting={votingActive}
>
    <span class="time-name hide cdefault">{name}</span>
    {#if !votingActive}
        <span class="time-span pos-abs cdefault"
            >{hours}:{padWithZeroes(minutes)}:{padWithZeroes(seconds)}</span
        >
        <button class="hide" type="button" on:click={beginVoting}
            >Vote Reset</button
        >
    {:else}
        <div class="cpointer" on:click={reasonDisplay}>
            <span class="time-span">Reset?</span>
            <div class="center-full flex-row">
                {#each Array(yesVotes) as _}
                    <div class="box yes" />
                {/each}
                {#each Array(noVotes) as _}
                    <div class="box no" />
                {/each}
                {#each Array(6 - yesVotes - noVotes) as _}
                    <div class="box unknown" />
                {/each}
            </div>
        </div>
        <div>
            <button class="hide" type="button" on:click={addYesVote}>Yes</button
            >
            <button class="hide" type="button" on:click={addNoVote}>No</button>
        </div>
    {/if}
</div>

<style>
    .timer {
        box-sizing: border-box;
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
        box-shadow: 0px 0px 0px 0px #ff0000;
        transition: background-size 0.5s ease, z-index 5s step-end,
            box-shadow 0.9s ease;
        overflow: hidden;
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

    .resetting {
        border: 10px solid red;
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

    .resetbs {
        box-shadow: 0px 0px 1px 1400px #ff0000 !important;
        transition: z-index 5s step-end, box-shadow 0.9s ease !important;
    }

    .flex-row {
        flex-direction: row !important;
    }

    .box {
        height: 17px;
        width: 34px;
        margin: 0;
        border: 1px solid black;
    }
    .yes {
        background-color: #189023;
    }
    .no {
        background-color: #6e1a18;
    }
    .unknown {
        background-color: #323233;
    }

    .cpointer {
        cursor: pointer;
    }
    .cdefault {
        cursor: default;
    }
</style>
