let backButton = document.getElementById("back-button");
let marketTable = document.getElementById("market-table");
let marketMessage = document.getElementById("market-message");

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
                <td><button class="purchase-button">Purchase</button></td>
			`;

			let purchaseButton = row.querySelector(".purchase-button")

			purchaseButton.addEventListener("click", function () {
				buyFish(fish.fish_id, fish.user, row);
			});

			marketTable.appendChild(row);
		}
	} catch (error) {
		console.error(error);
	}
}

async function buyFish(fishID, seller, rowElement) {
	try {
		let response = await fetch("/api/buymarket", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				fish_id: fishID,
				seller: seller
			})
		});

		let result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to purchase fish")
		}

		marketMessage.textContent = result.message;
		marketMessage.className = "success";

		rowElement.remove();
	} catch (error) {
		console.error(error)

		marketMessage.textContent = error.message;
		marketMessage.className = "error";
	}
}

loadFish();