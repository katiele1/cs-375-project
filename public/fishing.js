let fishingArea = document.querySelector(".fishing");
let bait = document.getElementById("bait");
let fish = document.querySelector(".fishing .sea .fish");
let progressBar = document.querySelector(".fishing .progress .bar");
let fishButton = document.getElementById("fish-button");
let result = document.getElementById("result");

let rodPower = 0.25;
let gravity = 0.01;
let weatherDisplay = document.getElementById("weather-display");

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
let almost70ProgressPlayed = false;

function updateFishingStats() {
	if (!window.currentUser) {
		return;
	}

	rodPower = 0.25 + (window.currentUser.rodLevel - 1) * 0.03;

	gravity = 0.01 - (window.currentUser.floatLevel - 1) * 0.0015;
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
    catchSpeed  += ((window.currentUser.baitLevel - 1 ) * 0.02)
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
			let caughtNoticeUser = window.currentUser ? window.currentUser.username : "Someone";
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

document.getElementById("switch-lobby-button").addEventListener("click", function () {
    resetGame();
	updateWeather();
});

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

gameLoop();

async function updateWeather() {
    let location = document.getElementById("lobby-select").value;

    switch (location) {
        case "Salty Ocean Water":
            location = "Ocean City, Maryland";
            break;
        case "Deep Ocean Water":
            location = "Belize City, Belize";
            break;
        case "Fresh River Water":
            location = "Milford, Pennsylvania";
            break;
        case "Brackish Water":
            location = "Barnegat Bay, New Jersey";
            break;
    }

    try {
        let response = await fetch(
            `/api/weather?location=${encodeURIComponent(location)}`
        );

        let data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        weatherDisplay.firstChild.textContent = `${location} Weather: ${data.condition}`;
    } catch (error) {
        weatherDisplay.firstChild.textContent = "Weather: Unavailable";
        console.error(error);
    }
}

updateWeather();
