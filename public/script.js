const socket = io("https://walkie-talkie-production-fe10.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
let mediaRecorder;

// Join Room
document.getElementById('join-btn').addEventListener('click', () => {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) return alert("Masukkan kode!");
    
    socket.emit('join-room', code);
    roomScreen.classList.remove('active');
    wtScreen.classList.add('active');
    
    // Inisialisasi Mic
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { audio: e.data });
    });
});

// PTT Events
pttBtn.addEventListener('mousedown', () => { if (mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Bicara..."; } });
pttBtn.addEventListener('mouseup', () => { if (mediaRecorder) { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap"; } });
pttBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); } });
pttBtn.addEventListener('touchend', (e) => { e.preventDefault(); if (mediaRecorder) { mediaRecorder.stop(); pttBtn.classList.remove('active'); } });

// Terima Audio
socket.on('audio-broadcast', (data) => {
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
});
