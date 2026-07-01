const socket = io("https://walkie-talkie-production-fe10.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const roomCodeInput = document.getElementById('room-code-input');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const displayRoomCode = document.getElementById('display-room-code');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const audioPlayback = document.getElementById('audio-playback');

let mediaRecorder;
let audioChunks = [];
let currentRoom = null;

// Fungsi Masuk Room
joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    if (code === "") return alert("Masukkan kode room!");

    currentRoom = code;
    displayRoomCode.textContent = currentRoom;
    socket.emit('join-room', currentRoom);

    roomScreen.classList.remove('active');
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
    wtScreen.classList.add('active');

    initMicrophone();
});

// Fungsi Mikrofon
function initMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        pttBtn.disabled = false;
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            socket.emit('audio-message', { room: currentRoom, audio: new Blob(audioChunks) });
            audioChunks = [];
        };
    }).catch(err => alert("Izin mikrofon diperlukan!"));
}

// Event PTT
const start = (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Merekam..."; } };
const stop = (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap Digunakan"; } };

pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);
pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);

// Terima Audio
socket.on('audio-broadcast', (data) => {
    statusText.textContent = "Menerima Suara...";
    audioPlayback.src = URL.createObjectURL(new Blob([data]));
    audioPlayback.play();
    audioPlayback.onended = () => statusText.textContent = "Siap Digunakan";
});

leaveBtn.addEventListener('click', () => window.location.reload());
