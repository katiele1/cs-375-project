let fishAlmostCaughtSound =
	new Audio("audio/fish_almost_caught.wav");

let completionSound =
	new Audio("audio/fish_caught.wav");

let fishFlappingSound =
	new Audio("audio/fish_flapping.wav");

let fishMovingSound =
	new Audio("audio/fish_moving.wav");

let coinSound =
	new Audio("audio/coin_sound.wav");

let gameMusic =
	new Audio("audio/game_music.wav");

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

let soundEffectsEnabled = true;
let musicEnabled = true;
let lastMusicActivity = Date.now();

function startBackgroundMusic() {
	if (!musicEnabled) {
		return;
	}

	lastMusicActivity = Date.now();

	if (!gameMusicPlaying) {
		gameMusic.play()
			.then(function () {
				gameMusicPlaying = true;
			})
			.catch(function (error) {
				console.log(error);
			});
	}
}

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

function setGameMusicOverlap(overlapped) {
	if (!gameMusicPlaying || !musicEnabled) {
		return;
	}

	if (overlapped) {
		gameMusic.volume =
			GAME_MUSIC_OVERLAP_VOLUME;
	} else {
		gameMusic.volume =
			GAME_MUSIC_VOLUME;
	}
}

function playEffect(sound) {
    if (!soundEffectsEnabled) return Promise.resolve();
    return sound.play().catch(err => console.log('Playback failed:', err));
}

function playMusic(sound) {
    if (!musicEnabled) return Promise.resolve();
    return sound.play().catch(err => console.log('Playback failed:', err));
}

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