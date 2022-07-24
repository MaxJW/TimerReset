<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import firebase from 'firebase/app';
    import { db } from '../firebase.js';
    import { time } from '../stores';
    import { padWithZeroes } from '../utils';

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

    export let discordID;

    let timer;
    let oldResetCount = 0;
    let resetter = false;
    let alert = new Audio('./sounds/alert.mp3');
    let reset = new Audio('./sounds/reset.mp3');
    let success = new Audio('./sounds/success.mp3');
    alert.volume = 0.5;
    reset.volume = 0.3;
    success.volume = 0.5;
    let votingStarted = false;
    let flipped = false;

    //get discord key from .env, send request to discord api to get user from id using key in authorization header
    //if user is not found, return null
    function getUser() {
        const dc_key = DISCORD_API_KEY;
        let url = `https://discord.com/api/v10/users/${discordID}`;
        let headers = new Headers();
        headers.append('Authorization', `Bot ${dc_key}`);
        return fetch(url, {
            headers: headers,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.avatar) {
                    return data;
                } else {
                    return null;
                }
            });
    }

    onMount(() => {
        timer = lastReset.toDate();
        oldResetCount = timesReset;
        //get user from id then assign avatar to dc-avatar
        getUser().then((user) => {
            if (user) {
                let avatar = user.avatar;
                let url = `https://cdn.discordapp.com/avatars/${discordID}/${avatar}.png`;
                let img = document.getElementById('dc-avatar');
                img.src = url;
            }
        });
    });

    function beginVoting() {
        if (!confirm('Are you sure you want to vote for a reset on ' + name + "'s timer?")) {
            return;
        }
        var reason = prompt('Enter a reason for ' + name + "'s reset", 'LoL Rage');
        if (reason != null) {
            if (reason.length > 60) {
                alert('Reason is too long, please state a shorter reason!');
                return;
            }
            votingStarted = true;
            dispatch('beginvote', { id, reason });
        }
    }

    function voteAlert() {
        alert.play();
        if (Notification.permission === 'granted') {
            var newnotif = new Notification(
                'Voting for resetting ' + name + "'s timer has started!",
            );
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    var newnotif = new Notification(
                        'Voting for resetting ' + name + "'s timer has started!",
                    );
                }
            });
        }
        votingStarted = false;
    }

    function votingEndedAlert() {
        success.play();
        if (Notification.permission === 'granted') {
            var newnotif = new Notification(name + "'s timer was NOT reset");
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    var newnotif = new Notification(name + "'s timer was NOT reset");
                }
            });
        }
    }

    const addYesVote = () => dispatch('yesvote', id);
    const addNoVote = () => dispatch('novote', id);
    const endVote = () => dispatch('endvote', id);

    //Reset a timer to 0, and store time in leaderboard
    function resetTimer() {
        let newResetTime = firebase.firestore.Timestamp.fromDate($time);
        let resetIncrease = timesReset + 1;
        let secondsSinceReset = currTime > longestResetSeconds ? currTime : 0;
        votingStarted = false;
        dispatch('reset', {
            id,
            newResetTime,
            resetIncrease,
            secondsSinceReset,
        });
    }

    function resetAlert() {
        resetter = true;
        reset.play();
        setTimeout(() => {
            resetter = false;
        }, 1000);

        if (Notification.permission === 'granted') {
            var newnotif = new Notification(name + ' had their timer reset!');
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    var newnotif = new Notification(name + ' had their timer reset!');
                }
            });
        }
    }

    const unsubscribe = db
        .collection('timers')
        .doc(id)
        .onSnapshot((doc) => {
            if (votingActive && votingStarted) {
                voteAlert();
            } else if (votingActive) {
                if (yesVotes + noVotes == 6 || yesVotes >= 4 || noVotes >= 3) {
                    if (yesVotes >= 4) {
                        resetTimer();
                    } else {
                        endVote();
                        votingEndedAlert();
                    }
                }
            } else {
                if (timesReset > oldResetCount) {
                    oldResetCount = timesReset;
                    timer = doc.data().lastReset.toDate();
                    resetAlert();
                }
                endVote();
            }
        });

    $: currTime = timer != null ? Math.floor(($time.getTime() - timer.getTime()) / 1000) : 0;
    $: hours = Math.floor(currTime / 3600);
    $: minutes = Math.floor(currTime / 60) - hours * 60; //Calculate number of minutes remaining
    $: seconds = Math.floor(currTime % 60); //Calculate number of seconds remaining (in current minute)

    onDestroy(unsubscribe);
</script>

<div
    class="timer"
    class:resetbs={resetter}
    class:resetting={votingActive}
    on:mouseleave={() => (flipped = false)}
>
    <!--<img
		class="solid"
		src="/images/{name}-anim.gif"
		alt="Profile animated gif"
	/>-->
    <img id="dc-avatar" class="solid" src="" alt="Profile opacity changes" />
    <div class="flipper cpointer hide" on:click={() => (flipped = !flipped)}>
        <i class="fas fa-info-circle" />
    </div>
    <div class="timer-inner" class:flip={flipped}>
        <span class="time-name hide cdefault">{name}</span>
        {#if !votingActive}
            <!--<span class="lastreason">{voteReason}</span>-->
            <span class="time-span pos-abs cdefault"
                >{hours}:{padWithZeroes(minutes)}:{padWithZeroes(seconds)}</span
            >
            <button class="hide" type="button" on:click={beginVoting}>Vote Reset</button>
        {:else}
            <div class="reset-container">
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
            <div class="voting-buttons">
                <button class="hide" type="button" on:click={addYesVote}>Yes</button>
                <button class="hide" type="button" on:click={addNoVote}>No</button>
            </div>
        {/if}
    </div>
    <div class="timer-inner" class:flip={!flipped}>
        {#if !votingActive}
            <span class="votereason cdefault"
                ><strong>Last Reset Reason</strong>
                <hr />
                {voteReason}</span
            >
        {:else}
            <span class="votereason cdefault"
                ><strong>Current Reset Reason</strong>
                <hr />
                {voteReason}</span
            >
        {/if}
    </div>
</div>

<style>
    .timer {
        box-sizing: border-box;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        align-items: center;
        box-shadow: 0px 0px 0px 0px #ff0000;
        transition: z-index 5s step-end, box-shadow 0.9s ease;
        overflow: hidden;
    }

    .timer > * {
        z-index: 1;
    }

    .timer-inner {
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        height: 100%;
        -webkit-backface-visibility: hidden; /* Safari */
        backface-visibility: hidden;
        transition: transform 0.8s ease, opacity 1s ease;
        transform-style: preserve-3d;
    }

    .flipper {
        position: absolute;
        top: 2px;
        z-index: 2;
        transition: color 0.2s ease;
    }

    .flipper:hover {
        color: #222a38;
    }

    .timer-inner.flip {
        -webkit-transform: rotateY(180deg);
        transform: rotateY(180deg);
        transition: transform 0.8s ease, opacity 1s ease;
        opacity: 0;
    }

    .solid {
        position: absolute;
        z-index: -1 !important;
        filter: brightness(70%);
        border-radius: 50%;
        -webkit-transform: scale(1);
        transform: scale(1);
        -webkit-transition: -webkit-transform 0.5s ease;
        transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .timer:hover .solid {
        -webkit-transform: scale(1.25);
        transform: scale(1.25);
        -webkit-transition: -webkit-transform 0.5s ease;
        transition: transform 0.5s ease;
    }

    /*.opac {
		position: absolute;
		z-index: 0 !important;
		filter: brightness(70%);
		border-radius: 50%;
		-webkit-transform: scale(1);
		transform: scale(1);
		opacity: 1;
		-webkit-transition: -webkit-transform 0.5s ease;
		transition: opacity 0.5s ease, transform 0.5s ease;
	}

	.timer:hover .opac {
		-webkit-transform: scale(1.25);
		transform: scale(1.25);
		opacity: 0;
		-webkit-transition: -webkit-transform 0.5s ease;
		transition: opacity 0.5s ease, transform 0.5s ease;
	}*/

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

    .votereason {
        font-size: 1.25rem;
        font-family: 'Roboto', sans-serif;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
        overflow: hidden;
        padding: 1.5rem;
    }

    .voting-buttons {
        margin-top: 17px;
    }

    .time-name {
        font-size: 2rem;
        font-family: 'Roboto', sans-serif;
        font-weight: bold;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }

    .time-span {
        font-family: 'Roboto Mono', monospace;
        font-size: 2.5rem;
        text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
    }

    .resetbs {
        box-shadow: 0px 0px 1px 1400px #ff0000 !important;
        transition: z-index 5s step-end, box-shadow 0.9s ease !important;
    }

    .reset-container {
        line-height: 30px;
        position: inherit;
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
