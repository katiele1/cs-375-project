let fishingArea = document.querySelector(".fishing");
let bait = document.getElementById("bait");
let fish = document.querySelector(".fishing .sea .fish");
let progressBar = document.querySelector(".fishing .progress .bar");
let sellButton = document.getElementById("sell-button");
let fishButton = document.getElementById("fish-button");
let marketButton = document.getElementById("market-button");
let result = document.getElementById("result");


let logoutButton = document.getElementById("logout-button");
let accountMessage = document.getElementById("account-message");
let loginButton = document.getElementById("login-button");
let registerButton = document.getElementById("register-button");
let currentUser = null;
let profileButton = document.getElementById("profile-button");

let fishAlmostCaughtSound = new Audio("audio/fish_almost_caught.wav");
let completionSound = new Audio("audio/fish_caught.wav");
let fishFlappingSound = new Audio("audio/fish_flapping.wav");
let fishMovingSound = new Audio("audio/fish_moving.wav");
let coinSound = new Audio("audio/coin_sound.wav");
let gameMusic = new Audio("audio/game_music.wav");

let MUSIC_STOP_DELAY = 10000;
let GAME_MUSIC_VOLUME = 0.25;
let GAME_MUSIC_OVERLAP_VOLUME = 0.1;
let FISH_FLAP_VOLUME = 0.5;

fishAlmostCaughtSound.volume = FISH_FLAP_VOLUME;
completionSound.volume = FISH_FLAP_VOLUME;
fishFlappingSound.volume = FISH_FLAP_VOLUME;
fishMovingSound.volume = FISH_FLAP_VOLUME;
coinSound.volume = FISH_FLAP_VOLUME;
gameMusic.volume = GAME_MUSIC_VOLUME;
gameMusic.loop = true;

let flappingPlaying = false;
let movingPlaying = false;
let gameMusicPlaying = false;
let almost70ProgressPlayed = false;

let soundEffectsEnabled = true;
let musicEnabled = true;
let lastMusicActivity = Date.now();

function playEffect(sound) {
    if (!soundEffectsEnabled) return Promise.resolve();
    return sound.play().catch(err => console.log('Playback failed:', err));
}

function playMusic(sound) {
    if (!musicEnabled) return Promise.resolve();
    return sound.play().catch(err => console.log('Playback failed:', err));
}

function setGameMusicOverlap(overlapped) {
    if (!gameMusicPlaying || !musicEnabled) return;
    gameMusic.volume = overlapped ? GAME_MUSIC_OVERLAP_VOLUME : GAME_MUSIC_VOLUME;
}


function startBackgroundMusic() {
    if (!musicEnabled) return;
    lastMusicActivity = Date.now();
    if (!gameMusicPlaying) {
        playMusic(gameMusic).then(() => {
            gameMusicPlaying = true;
        }).catch(() => {});
    }
}

profileButton.addEventListener("click", function () {
	location.href = "profile.html";
});

loginButton.addEventListener("click", function () {
	location.href = "login.html";
});

sellButton.addEventListener("click", function () {
	location.href = "sell.html";
});

marketButton.addEventListener("click", function () {
	location.href = "market.html";
});

registerButton.addEventListener("click", function () {
	location.href = "register.html";
});

document.getElementById("bait-upgrade")
    .addEventListener("click", () => buyUpgrade("bait"));

document.getElementById("float-upgrade")
    .addEventListener("click", () => buyUpgrade("float"));

document.getElementById("rod-upgrade")
    .addEventListener("click", () => buyUpgrade("rod"));

if (logoutButton) {
	logoutButton.addEventListener("click", async function () {
		await fetch("/api/logout", {
			method: "POST",
		});

		location.reload();
	});
}

let rodPower = 0.25 + (currentUser.rodLevel - 1) * 0.03;
let gravity = 0.01 - (currentUser.floatLevel - 1) * 0.0015;
let baitPosition = 70;
let baitVelocity = 0;
let fishPosition = Math.random() * 70;
let fishSpeed;
let catchSpeed;
let fishData = null;

let progress = 0;
let holding = false;
let fishDirection = 1;
let gameRunning = false;

function stopFishingSounds() {
    if (flappingPlaying) {
        fishFlappingSound.pause();
        fishFlappingSound.currentTime = 0;
        flappingPlaying = false;
    }
    if (movingPlaying) {
        fishMovingSound.pause();
        fishMovingSound.currentTime = 0;
        movingPlaying = false;
    }
    setGameMusicOverlap(false);
}

fishButton.addEventListener("mousedown", () => {
    startBackgroundMusic();
    holding = true;
    if (soundEffectsEnabled) {
    if (!flappingPlaying) {
            fishFlappingSound.loop = true;
            fishFlappingSound.play().catch(err => console.log("Playback failed:", err));
            flappingPlaying = true;
        }
        if (!movingPlaying) {
            fishMovingSound.loop = true;
            fishMovingSound.play().catch(err => console.log("Playback failed:", err));
            movingPlaying = true;
        }
        setGameMusicOverlap(true);
    }
});

fishButton.addEventListener("mouseup", () => {
    stopFishingSounds();
    holding = false;
});

fishButton.addEventListener("mouseleave", () => {
    stopFishingSounds();
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
    catchSpeed  += ((currentUser.baitLevel - 1 ) * 0.02)
}

async function generateFish() {
    try {
        let response = await fetch("/api/generateFish", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                location: document.getElementById("lobby-select").value
            })
        });

        fishData = await response.json();

        if (!response.ok) {
            throw new Error(fishData.error);
        }
        initializeFishMovement();
        return true;

    } catch (error) {
        result.textContent = error.message;
        return false;
    }
}
function updateBait() {
    if (holding) {
        // Move upward
        baitVelocity = -rodPower;
    } else {
        // Gravity pulls the bait downward, adds a bit of float when releasing
        baitVelocity += gravity;
    }

    // Limit falling speed
    if (baitVelocity > 0.15) {
        baitVelocity = 0.15;
    }

    baitPosition += baitVelocity;

    // Top boundary
    if (baitPosition <= 0) {
        baitPosition = 0;
        baitVelocity = 0;
    }

    // Bottom boundary
    if (baitPosition >= 79) {
        baitPosition = 79;
        baitVelocity = 0;
    }
}


function updateFish() {

    fishPosition += fishDirection * fishSpeed;

    if (fishPosition <= 0) {
        fishPosition = 0;
        fishDirection = 1;
    }

    if (fishPosition >= 90) {
        fishPosition = 79;
        fishDirection = -1;
    }
}

function checkCollision() {

    let baitRect = bait.getBoundingClientRect();
    let fishRect = fish.getBoundingClientRect();
    if (progress > 70 && !almost70ProgressPlayed) {
            if (soundEffectsEnabled) fishAlmostCaughtSound.play().catch(err => 
                console.log("Playback failed:", err));
            almost70ProgressPlayed = true;
        }

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
    if (!gameRunning) {
        return;
    }
    gameRunning = false;
    holding = false;
    fishButton.disabled = true;

    try {
        let response = await fetch("/api/catchFish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fish_id: fishData.fish_id
            })
        });

        let data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }
        stopFishingSounds();

        if (soundEffectsEnabled) {
            completionSound.play().catch(err => console.log("Playback failed:", err));
            coinSound.play().catch(err => console.log("Playback failed:", err));
        }

        result.textContent =
            `You caught a ${fishData.name}! ` +
            `It weighs ${fishData.weight} kgs and is worth ` +
            `${fishData.value} coins.`;

		if (socket && socket.readyState === WebSocket.OPEN) {
			let caughtNoticeUser = currentUser ? currentUser.username : "Someone";
            let currentLobby = document.getElementById("lobby-select").value;

			socket.send(JSON.stringify({
  				type: "catch",
                lobby: currentLobby,
  		  		text: `${caughtNoticeUser} just caught a ${fishData.name} (${fishData.weight} kgs)!`
			}));
        }
        } catch (error) {
            result.textContent = error.message;
        }

        //Restarts the game
        setTimeout(resetGame, 2000);
    
}

async function buyUpgrade(upgrade) {
    try {
        let response = await fetch("/api/upgrade", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({upgrade: upgrade})
        });

        let data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        if (upgrade === "bait") {
            currentUser.baitLevel = data.level;
        }

        if (upgrade === "float") {
            currentUser.floatLevel = data.level;
        }

        if (upgrade === "reel") {
            currentUser.rodLevel = data.level;
        }

        currentUser.coins = data.coins;

        updateUpgradeDisplay();

    } catch (error) {
        alert(error.message);
    }
}

function updateUpgradeDisplay() {
    document.getElementById("bait-level").textContent =currentUser.baitLevel;

    document.getElementById("float-level").textContent =currentUser.floatLevel;

    document.getElementById("rod-level").textContent =currentUser.rodLevel;
}


function resetGame() {
    gameRunning = true;
    holding = false;
    progress = 0;

    baitPosition = 70;
    baitVelocity = 0;
    fishPosition = Math.random() * 70;
    fishDirection = 1;

    progressBar.style.height = "0%";
    result.textContent = "";

    fishButton.disabled = false;
    stopFishingSounds();
    almost70ProgressPlayed = false;
    setGameMusicOverlap(false);
    startGame();
}

document.getElementById("lobby-select").addEventListener("change", function () {
    resetGame();
});

function setSoundToggles() {
    let soundEffectToggle = document.getElementById('sound-effect-toggle');
    let musicToggle = document.getElementById('music-toggle');

    soundEffectToggle.checked = soundEffectsEnabled;
    soundEffectToggle.addEventListener('change', () => {
        soundEffectsEnabled = soundEffectToggle.checked;
        if (!soundEffectsEnabled) stopFishingSounds();
    });

    musicToggle.checked = musicEnabled;
    musicToggle.addEventListener('change', () => {
        musicEnabled = musicToggle.checked;
        if (!musicEnabled) {
            if (gameMusicPlaying) {
                gameMusic.pause();
                gameMusic.currentTime = 0;
                gameMusicPlaying = false;
            }
        } else {
            startBackgroundMusic();
        }
    });
}

setSoundToggles();


async function startGame() {
    let success = await generateFish();

    if (!success) {
        gameRunning = false;
        return;
    }
    gameRunning = true;

}


function gameLoop() {
    if (gameRunning) {
        if (holding) lastMusicActivity = Date.now();
        updateBait();
        updateFish();
        updateProgress();
        render();
    }
    else {
        stopFishingSounds();
    }
     if (gameMusicPlaying && Date.now() - lastMusicActivity > MUSIC_STOP_DELAY) {
        gameMusic.pause();
        gameMusic.currentTime = 0;
        gameMusicPlaying = false;
    }

    if (gameMusicPlaying) {
        if (flappingPlaying || movingPlaying) {
            setGameMusicOverlap(true);
        } else {
            setGameMusicOverlap(false);
        }
    }
    requestAnimationFrame(gameLoop);
}

startGame();
gameLoop();

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
            updateUpgradeDisplay();
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
