document.getElementById("bait-upgrade")
    .addEventListener("click", () => buyUpgrade("bait"));

document.getElementById("float-upgrade")
    .addEventListener("click", () => buyUpgrade("float"));

document.getElementById("rod-upgrade")
    .addEventListener("click", () => buyUpgrade("rod"));

async function buyUpgrade(upgrade) {
	try {
		let response = await fetch("/api/upgrade", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				upgrade: upgrade,
			}),
		});

		let data = await response.json();

		if (!response.ok) {
			throw new Error(data.error);
		}

		if (upgrade === "bait") {
			window.currentUser.baitLevel = data.level;
		}

		if (upgrade === "float") {
			window.currentUser.floatLevel = data.level;
		}

		if (upgrade === "rod") {
			window.currentUser.rodLevel = data.level;
		}

		window.currentUser.coins = data.coins;

		updateUpgradeDisplay();
		updateFishingStats();
	} catch (error) {
		alert(error.message);
	}
}

function updateUpgradeDisplay() {
	if (!window.currentUser) {
		return;
	}

	document.getElementById("bait-level").textContent =
		window.currentUser.baitLevel;

	document.getElementById("float-level").textContent =
		window.currentUser.floatLevel;

	document.getElementById("rod-level").textContent =
		window.currentUser.rodLevel;
}