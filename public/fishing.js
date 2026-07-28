let fishButton = document.getElementById("fish-button");
let result = document.getElementById("result");

fishButton.addEventListener("click", async function () {
	try {
		result.textContent = "Fishing...";

		let response = await fetch("/api/fish", {
			method: "POST",
		});

		let fish = await response.json();

		if (!response.ok) {
			throw new Error(fish.error);
		}

		result.textContent =
			`You caught a ${fish.name}! ` +
			`It weighs ${fish.weight} pounds and is worth ` +
			`${fish.value} coins.`;
	} catch (error) {
		result.textContent = error.message;
	}
});
