let fishingArea = document.querySelector(".fishing");
let bait = document.getElementById("bait");
let fish = document.querySelector(".fishing .sea .fish");
let progressBar = document.querySelector(".fishing .progress .bar");
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


let fishGenerated = false;
let baitPosition = 70;
let fishPosition = Math.random() * 70;
let fishSpeed;
let catchSpeed;
let fishData;

let progress = 0;

let holding = false;
let fishDirection = 1;

let gameRunning = true;




fishButton.addEventListener("mousedown", () => {
    holding = true;
});

fishButton.addEventListener("mouseup", () => {
    holding = false;
});

fishButton.addEventListener("mouseleave", () => {
    holding = false;
});

function initializeFishMovement(){
    let weight = fishData.weight;
    if (weight >= 40){
        fishSpeed = 0.2;
        catchSpeed = 0.1;
    }
    else if ( weight >= 10){
        fishSpeed = 0.3;
        catchSpeed = 0.15;
    } else {
        fishSpeed = 0.35;
        catchSpeed = 0.2;
    }
}

async function  generateFish(){
    try {
        let response = await fetch("/api/fish", {
            method: "POST"
        });

        fishData = await response.json();

        if (!response.ok) {
            throw new Error(fishData.error);
        }
    } catch (error) {
        result.textContent = error.message;
    }
}

function updateBait() {

    if (holding) {
        // Holding the button moves the bait upward
        baitPosition -= 0.25;
    } else {
        // Releasing the button lets the bait fall
        baitPosition += 0.18;
    }

    // Don't let the bait leave the fishing area
    if (baitPosition < 0) {
        baitPosition = 0;
    }

    if (baitPosition > 79) {
        baitPosition = 79;
    }
}


function updateFish() {

    fishPosition += fishDirection * fishSpeed;

    if (fishPosition <= 0) {
        fishPosition = 0;
        fishDirection = 1;
    }

    if (fishPosition >= 90) {
        fishPosition = 90;
        fishDirection = -1;
    }
}

function checkCollision() {

    let baitRect = bait.getBoundingClientRect();
    let fishRect = fish.getBoundingClientRect();

    return !(
        baitRect.right < fishRect.left ||
        baitRect.left > fishRect.right ||
        baitRect.bottom < fishRect.top ||
        baitRect.top > fishRect.bottom
    );
}


function updateProgress() {

    if (checkCollision()) {
        progress += catchSpeed;
    } else {
        progress -= 0.1;
    }

    // Keep progress between 0 and 100
    if (progress < 0) {
        progress = 0;
    }

    if (progress > 100) {
        progress = 100;
    }

    progressBar.style.height = progress + "%";

    if (progress >= 100) {
        catchFish();
    }
}

function render() {

    bait.style.top = baitPosition + "%";
    fish.style.top = fishPosition + "%";

}

async function catchFish() {
    gameRunning = false;
    holding = false;
    fishButton.disabled = true;

    result.textContent = "You caught a fish!";
        result.textContent =
            `You caught a ${fishData.name}! ` +
            `It weighs ${fishData.weight} pounds and is worth ` +
            `${fishData.value} coins.`;

        //Restarts the game
        setTimeout(resetGame, 2000);
    
}


function resetGame() {
    gameRunning = true;
    holding = false;
    progress = 0;

    baitPosition = 70;
    fishPosition = Math.random() * 70;
    fishDirection = 1;

    progressBar.style.height = "0%";
    result.textContent = "";

    fishButton.disabled = false;
}




function gameLoop() {

    if (gameRunning) {
        if (!fishGenerated){
            generateFish();
            fishGenerated = true;
        }

        updateBait();
        updateFish();
        updateProgress();
        render();

    }

    requestAnimationFrame(gameLoop);
}

gameLoop();

/*
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
*/

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
