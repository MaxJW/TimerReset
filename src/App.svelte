<script>
	import "normalize.css"; //Normalize CSS elements - https://necolas.github.io/normalize.css/
	import firebase from "firebase/app";
	import "firebase/firestore";
	import { db, auth, googleProvider } from "./firebase.js";
	import { authState } from "rxfire/auth";
	import { collectionData } from "rxfire/firestore";
	import { startWith } from "rxjs/operators";
	import Timer from "./components/Timer.svelte";
	import Leaderboard from "./components/Leaderboard.svelte";
	import Total from "./components/Total.svelte";
	import { onDestroy } from "svelte";

	let user;
	let voter;
	const unsubscribe = authState(auth).subscribe((u) => {
		user = u;
		voter = db.collection("voters").doc(u.uid);
	});
	function login() {
		auth.signInWithPopup(googleProvider);
	}

	const query = db.collection("timers").orderBy("name");
	const timers = collectionData(query, "id").pipe(startWith([]));

	$: leaderboard = $timers.map((a) => ({
		lrs: a.longestResetSeconds,
		tr: a.timesReset,
		n: a.name,
	}));

	function resetTimer(event) {
		const {
			id,
			newResetTime,
			resetIncrease,
			secondsSinceReset,
		} = event.detail;

		let newData =
			secondsSinceReset > 0
				? {
						lastReset: newResetTime,
						timesReset: resetIncrease,
						longestResetSeconds: secondsSinceReset,
						yesVotes: 0,
						noVotes: 0,
						votingActive: false,
				  }
				: {
						lastReset: newResetTime,
						timesReset: resetIncrease,
						yesVotes: 0,
						noVotes: 0,
						votingActive: false,
				  };
		db.collection("timers").doc(id).update(newData);
		resetVoting();
	}

	function beginVoting(event) {
		const { id, reason } = event.detail;
		let newData = { votingActive: true, voteReason: reason };
		db.collection("timers").doc(id).update(newData);
		addYesVote(event);
	}

	function addYesVote(event) {
		const id = event.detail;
		voter.get().then((doc) => {
			if (doc.data()[id] == false) {
				db.collection("timers")
					.doc(id)
					.update({
						yesVotes: firebase.firestore.FieldValue.increment(1),
					});
				voter.update({
					[id]: true,
				});
			}
		});
	}

	function addNoVote(event) {
		const id = event.detail;
		voter.get().then((doc) => {
			if (doc.data()[id] == false) {
				db.collection("timers")
					.doc(id)
					.update({
						noVotes: firebase.firestore.FieldValue.increment(1),
					});
				voter.update({
					[id]: true,
				});
			}
		});
	}

	function resetVoting(event) {
		const id = event.detail;

		let newData = {
			yesVotes: 0,
			noVotes: 0,
			votingActive: false,
			voteReason: "",
		};
		db.collection("timers").doc(id).update(newData);
		db.collection("voters")
			.get()
			.then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					doc.ref.update({
						[id]: false,
					});
				});
			});
	}

	onDestroy(unsubscribe);
</script>

{#if user}
	<Leaderboard {leaderboard} />

	<div id="main" class="center-full">
		<h1>Timer Reset Dashboard</h1>
		<div class="w-100 grid">
			{#each $timers as timer}
				<Timer
					{...timer}
					on:reset={resetTimer}
					on:beginvote={beginVoting}
					on:yesvote={addYesVote}
					on:novote={addNoVote}
					on:endvote={resetVoting}
				/>
			{/each}
		</div>
		<Total {leaderboard} />
	</div>
{:else}
	<div class="center-full h-100">
		<button on:click={login} class="center-full">
			Sign In with Google
		</button>
	</div>
{/if}

<style>
	#main {
		min-height: 100vh;
		justify-content: space-around !important;
	}

	h1 {
		font-size: 2rem;
		font-family: "Righteous", cursive;
		text-shadow: 0 1px 5px rgb(0 0 0 / 50%);
		letter-spacing: 1.5px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: auto;
		gap: 2rem;
		align-items: center;
		justify-items: center;
	}

	@media (max-width: 830px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 545px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
