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
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
});

// Setup Mic (Minta Izin saat pertama kali klik)
async function setupRecorder() {
    if (mediaRecorder) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { audio: e.data });
    } catch (e) { alert("Mikrofon tidak diizinkan!"); }
}

// Event PTT (Mouse & Touch)
const start = async (e) => { e.preventDefault(); await setupRecorder(); mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Sedang Bicara..."; };
const stop = (e) => { e.preventDefault(); if(mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap Digunakan"; } };

pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);
pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);

// Terima Audio
socket.on('audio-broadcast', (data) => {
    statusText.textContent = "Menerima Suara...";
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
    audio.onended = () => statusText.textContent = "Siap Digunakan";
});
