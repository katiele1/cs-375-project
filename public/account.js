window.currentUser = null;

let logoutButton = document.getElementById("logout-button");
let accountMessage = document.getElementById("account-message");
let loginButton = document.getElementById("login-button");
let registerButton = document.getElementById("register-button");
let profileButton = document.getElementById("profile-button");
let sellButton = document.getElementById("sell-button");
let marketButton = document.getElementById("market-button");

if (profileButton) {
	profileButton.addEventListener("click", function () {
		location.href = "profile.html";
	});
}

if (loginButton) {
	loginButton.addEventListener("click", function () {
		location.href = "login.html";
	});
}

if (registerButton) {
	registerButton.addEventListener("click", function () {
		location.href = "register.html";
	});
}

if (sellButton) {
	sellButton.addEventListener("click", function () {
		location.href = "sell.html";
	});
}

if (marketButton) {
	marketButton.addEventListener("click", function () {
		location.href = "market.html";
	});
}

if (logoutButton) {
	logoutButton.addEventListener("click", async function () {
		await fetch("/api/logout", {
			method: "POST",
		});

		location.reload();
	});
}

async function checkLoginStatus() {
	try {
		let response = await fetch("/api/me");
		let data = await response.json();

		if (response.ok && data.loggedIn) {
			window.currentUser = data.user;

			accountMessage.textContent =
				`Logged in as ${data.user.username}`;

			loginButton.hidden = true;
			registerButton.hidden = true;
			logoutButton.hidden = false;

			updateUpgradeDisplay();
			updateFishingStats();

			startGame();
		} else {
			window.currentUser = null;

			accountMessage.textContent =
				"You are playing anonymously.";

			loginButton.hidden = false;
			registerButton.hidden = false;
			logoutButton.hidden = true;
		}
	} catch (error) {
		console.error(error);

		accountMessage.textContent =
			"Could not check login status.";

		window.currentUser = null;
	}

	if (typeof setupWebSocket === "function") {
		setupWebSocket();
	}
}

checkLoginStatus();