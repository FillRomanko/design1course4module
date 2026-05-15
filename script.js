const audio = new Audio();
audio.src = "assets/background.mp3";
audio.volume = 0.3;
audio.loop = true;
audio.preload = "auto";
audio.load();

function attemptPlay() {
    if (!audio.paused) return;

    audio.play().catch(() => {
    });
}

const gestureEvents = ["click", "touchstart", "keydown"];
function onUserGesture() {
    attemptPlay();
    if (!audio.paused) {
        gestureEvents.forEach(event => document.removeEventListener(event, onUserGesture));
    }
}
gestureEvents.forEach(event => document.addEventListener(event, onUserGesture));