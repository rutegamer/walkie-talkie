const socket = io("https://walkie-talkie-production-fe10.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
let mediaRecorder;
let audioChunks = [];

// Join Room
document.getElementById('join-btn').addEventListener('click', () => {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) return alert("Masukkan kode!");
    
    socket.emit('join-room', code);
    roomScreen.style.display = 'none';
    wtScreen.style.display = 'flex';
    wtScreen.classList.add('active'); // Pastikan muncul
});

// Fungsi Perizinan yang Aman
async function getMicPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            socket.emit('audio-message', { audio: audioBlob });
            audioChunks = [];
        };
        
        return true;
    } catch (err) {
        alert("Akses Mikrofon ditolak! Aplikasi tidak bisa berjalan tanpa mikrofon.");
        return false;
    }
}

// Event PTT
pttBtn.addEventListener('touchstart', async (e) => {
    e.preventDefault();
    if (!mediaRecorder) {
        const granted = await getMicPermission();
        if (!granted) return;
    }
    mediaRecorder.start();
    pttBtn.classList.add('active');
    statusText.textContent = "Sedang Bicara...";
}, { passive: false });

pttBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        pttBtn.classList.remove('active');
        statusText.textContent = "Siap Digunakan";
    }
});

// Terima Audio
socket.on('audio-broadcast', (data) => {
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
    statusText.textContent = "Menerima Suara...";
    audio.onended = () => statusText.textContent = "Siap Digunakan";
});
