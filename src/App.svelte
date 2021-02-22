<script>
	import "normalize.css"; //Normalize CSS elements - https://necolas.github.io/normalize.css/
	import { db } from "firebase";
	import { collectionData } from "rxfire/firestore";
	import { startWith } from "rxjs/operators";
	import Timer from "./components/Timer.svelte";
	import Leaderboard from "./components/Leaderboard.svelte";
	import Total from "./components/Total.svelte";

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
				  }
				: { lastReset: newResetTime, timesReset: resetIncrease };
		db.collection("timers").doc(id).update(newData);
	}
</script>

<Leaderboard {leaderboard} />

<div id="main" class="center-full">
	<h1>Timer Reset Dashboard</h1>
	<div class="w-100 grid">
		{#each $timers as timer}
			<Timer {...timer} on:reset={resetTimer} />
		{/each}
	</div>
	<Total {leaderboard} />
</div>

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
