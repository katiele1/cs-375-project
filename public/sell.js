let username = "";

let backButton = document.getElementById("back-button");

let sellDropdown = document.getElementById("sell-dropdown")
let listButton = document.getElementById("list-button")
let sellInput = document.getElementById("sell-value")

let sellMessage = document.getElementById("sell-message")

backButton.addEventListener("click", function () {
	location.href = "index.html";
});

listButton.addEventListener("click", async function () {
	try {
        let id = sellDropdown.value;
        let fishLabel = sellDropdown.options[sellDropdown.selectedIndex].text
        let sellValue = sellInput.value;
        let response = await fetch("/api/sell", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                catch_id: id,
                cost: sellValue
            })
        });

        if (response.ok) {
            sellInput.value = "";
            await loadFish();
            sellMessage.textContent = `Successfully listed ${fishLabel} for ${sellValue} coins.`
        }

    } catch (error) {
            console.log(error.message);
        }
    });

async function checkLogin() {
	try {
		let response = await fetch("/api/me");
		let data = await response.json();

		if (!response.ok || !data.loggedIn) {
			location.href = "login.html";
			return;
		}

	} catch (error) {
		console.error(error);
		alert("Error.");
	}
}

async function loadFish() {
	try {
		let response = await fetch("/api/inventory", {
			method: "POST",
		});
		
		let fishes = await response.json();

		if (!response.ok) {
			throw new Error(fishes.error);
		}

        sellDropdown.innerHTML = `<option value="-1">Select a fish to sell...</option>`

        fishes.forEach(fish => {
            let option = document.createElement("option");
            option.value = fish.catch_id;
            option.textContent = `${fish.name} (${fish.weight} kg)`;
            sellDropdown.appendChild(option);
        });

	} catch (error) {
		console.error(error);
	}
}

checkLogin();
loadFish();