let username = document.getElementById("username");
let email = document.getElementById("email");
let coins = document.getElementById("coins");
let level = document.getElementById("level");
let experience = document.getElementById("experience");

let backButton = document.getElementById("back-button");

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

loadProfile();