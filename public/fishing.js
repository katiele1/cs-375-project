let fishButton = document.getElementById("fish-button");
let result = document.getElementById("result");
let logoutButton = document.getElementById("logout-button");
let accountMessage = document.getElementById("account-message");
let loginLink = document.getElementById("login-link");
let registerLink = document.getElementById("register-link");
let loginButton = document.getElementById("login-button");
let registerButton = document.getElementById("register-button");
let currentUser = null;

loginButton.addEventListener("click", function () {
	location.href = "login.html";
});

registerButton.addEventListener("click", function () {
	location.href = "register.html";
});

if (logoutButton) {
	logoutButton.addEventListener("click", async function () {
		await fetch("/api/logout", {
			method: "POST",
		});

		location.reload();
	});
}

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
		
		if (socket && socket.readyState === WebSocket.OPEN) {
			let caughtNoticeUser;

			if (currentUser) {
				caughtNoticeUser = currentUser.username;
			} else {
				caughtNoticeUser = "Someone";
			}
			socket.send(JSON.stringify({
  				type: "catch",
  		  		text: `${caughtNoticeUser} just caught a ${fish.name} (${fish.weight} lbs)!`
			}));
		}
	} catch (error) {
		result.textContent = error.message;
	}
});

async function checkLoginStatus() {
	try {
		let response = await fetch("/api/me");
		let data = await response.json();

		if (response.ok && data.loggedIn) {
			accountMessage.textContent = `Logged in as ${data.user.username}`;
			currentUser = data.user;
			loginButton.hidden = true;
			registerButton.hidden = true;
			logoutButton.hidden = false;
		} else {
			accountMessage.textContent = "You are playing anonymously.";
			currentUser = null;
			loginButton.hidden = false;
			registerButton.hidden = false;
			logoutButton.hidden = true;
		}
	} catch (error) {
		accountMessage.textContent = "Could not check login status.";
		currentUser = null;
	}

	if (typeof setupWebSocket === "function") {
		setupWebSocket();
	}
}


checkLoginStatus();
