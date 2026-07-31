let inventoryButton = document.getElementById("inventory-button");
let inventoryTable = document.getElementById("inventory-table");

inventoryButton.addEventListener("click", async function () {
	try {
		let response = await fetch("/api/inventory", {
			method: "POST",
		});

		let inventory = await response.json();

		if (!response.ok) {
			throw new Error(inventory.error);
		}

        while (inventoryTable.firstChild) {
            inventoryTable.removeChild(inventoryTable.firstChild);
        }

        for (let fish of inventory) {
            let row = document.createElement("tr");

            let idCell = document.createElement("td");
            console.log(fish.fish_id);
            idCell.textContent = fish.fish_id;
            row.append(idCell);

            let weightCell = document.createElement("td");
            console.log(fish.weight);
            weightCell.textContent = fish.weight;
            row.append(weightCell);

            let valueCell = document.createElement("td");
            console.log(fish.value);
            valueCell.textContent = fish.value;
            row.append(valueCell);
            inventoryTable.append(row);
        }

	} catch (error) {
		result.textContent = error.message;
	}
});
