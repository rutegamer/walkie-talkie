const socket = io("https://walkie-talkie-production-fe10.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const joinBtn = document.getElementById('join-btn');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const audioPlayback = document.getElementById('audio-playback');

let mediaRecorder;
let audioChunks = [];
let currentRoom = null;

joinBtn.addEventListener('click', () => {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) return alert("Masukkan kode!");
    
    currentRoom = code;
    socket.emit('join-room', currentRoom);
    
    roomScreen.style.display = 'none';
    wtScreen.style.display = 'flex';
    initMicrophone();
});

function initMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            socket.emit('audio-message', { room: currentRoom, audio: new Blob(audioChunks) });
            audioChunks = [];
        };
    });
}

const start = (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Merekam..."; } };
const stop = (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap Digunakan"; } };

pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);
pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);

socket.on('audio-broadcast', (data) => {
    audioPlayback.src = URL.createObjectURL(new Blob([data]));
    audioPlayback.play();
});
