let backButton = document.getElementById("back-button");
let marketTable = document.getElementById("market-table");

backButton.addEventListener("click", function () {
	location.href = "index.html";
});

async function loadFish() {
	try {
		let response = await fetch("/api/marketlist", {
			method: "POST",
		});
		
		let fishes = await response.json();

		if (!response.ok) {
			throw new Error(fishes.error);
		}

		marketTable.innerHTML = "";

		for (let fish of fishes) {
			let row = document.createElement("tr");
            
			row.innerHTML = `
				<td>${fish.user}</td>
				<td>${fish.fish_id}</td>
				<td>${fish.weight}</td>
				<td>${fish.cost}</td>
                <td><button>Temp Button</button></td>
			`;

			marketTable.appendChild(row);
		}
	} catch (error) {
		console.error(error);
	}
}

loadFish();