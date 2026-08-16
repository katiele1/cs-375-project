let username = document.getElementById("username");
let email = document.getElementById("email");
let coins = document.getElementById("coins");
let level = document.getElementById("level");
let experience = document.getElementById("experience");

let backButton = document.getElementById("back-button");
let fishTable = document.getElementById("profile-fish-table");

backButton.addEventListener("click", function () {
	location.href = "index.html";
});

async function loadProfile() {
	try {
		let response = await fetch("/api/me");
		let data = await response.json();

		if (!response.ok || !data.loggedIn) {
			location.href = "login.html";
			return;
		}

		username.textContent = data.user.username;
		email.textContent = data.user.email;
		coins.textContent = data.user.coins;
		level.textContent = data.user.level;
		experience.textContent = data.user.experience;
	} catch (error) {
		console.error(error);
		alert("Could not load profile.");
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

		fishTable.innerHTML = "";

		for (let fish of fishes) {
			let row = document.createElement("tr");

			row.innerHTML = `
				<td> <img class="fish-image" src="${fish.image}" alt="${fish.name}"> </td>
				<td>${fish.name}</td>
				<td>${fish.rarity}</td>
				<td>${fish.weight}</td>
				<td>${fish.value}</td>
				<td>${fish.location}</td>
			`;

			fishTable.appendChild(row);
		}
	} catch (error) {
		console.error(error);
	}
}

loadProfile();
loadFish();