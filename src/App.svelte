<script>
	import "normalize.css"; //Normalize CSS elements - https://necolas.github.io/normalize.css/
	import { db } from "./firebase";
	import Timer from "./components/Timer.svelte";
	import TimeDate from "./components/TimeDate.svelte";
	import { collectionData } from "rxfire/firestore";
	import { startWith } from "rxjs/operators";

	const query = db.collection("timers");
	const timers = collectionData(query, "id").pipe(startWith([]));

	function resetTimer(event) {
		const { id, newResetTime, resetIncrease } = event.detail;
		db.collection("timers")
			.doc(id)
			.update({ lastReset: newResetTime, timesReset: resetIncrease });
	}
</script>

<TimeDate />

<div class="pos-abs center-full w-100 h-100">
	{#each $timers as timer}
		<Timer {...timer} on:reset={resetTimer} />
	{/each}
</div>

<style>
</style>
