const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge'); // Badge baru
let mediaRecorder;

// Join Room
document.getElementById('join-btn').addEventListener('click', () => {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) return alert("Masukkan kode!");
    
    socket.emit('join-room', code);
    document.getElementById('display-room-code').textContent = code;
    
    roomScreen.classList.remove('active');
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
    wtScreen.classList.add('active');
    
    initMic();
});

// Update jumlah user secara Realtime
socket.on('user-count', (count) => {
    userBadge.textContent = `Online: ${count}`;
});

// Setup Mic
function initMic() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        pttBtn.disabled = false;
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { room: document.getElementById('display-room-code').textContent, audio: e.data });
    });
}

// PTT Events
const start = (e) => { e.preventDefault(); if(mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Sedang Bicara..."; } };
const stop = (e) => { e.preventDefault(); if(mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap Digunakan"; } };

pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);
pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);

// Terima Audio
socket.on('audio-broadcast', (data) => {
    statusText.textContent = "Menerima Suara...";
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
    audio.onended = () => statusText.textContent = "Siap Digunakan";
});

document.getElementById('leave-btn').addEventListener('click', () => window.location.reload());
