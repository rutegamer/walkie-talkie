window.onload = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => console.log("Izin Mikrofon Diterima"))
        .catch(err => alert("Anda HARUS mengizinkan mikrofon untuk menggunakan aplikasi ini!"));
};

const socket = io("https://walkie-talkie-production-fe10.up.railway.app", {
    transports: ['websocket']
});

socket.on('connect', () => alert('Berhasil terhubung ke server!'));
socket.on('connect_error', (err) => alert('Gagal terhubung: ' + err.message));

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const roomCodeInput = document.getElementById('room-code-input');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const displayRoomCode = document.getElementById('display-room-code');
const loadingText = document.getElementById('loading-text');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const audioPlayback = document.getElementById('audio-playback');

let mediaRecorder;
let audioChunks = [];
let currentRoom = null;

// HANYA SATU EVENT LISTENER
joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    if (code === "") return alert("Masukkan kode room!");

    joinBtn.disabled = true;
    loadingText.classList.remove('hidden');

    currentRoom = code;
    displayRoomCode.textContent = currentRoom;
    socket.emit('join-room', currentRoom);

    // Perpindahan Layar
    roomScreen.className = 'screen hidden'; 
    wtScreen.className = 'screen active';

    loadingText.classList.add('hidden');
    initMicrophone();
});

leaveBtn.addEventListener('click', () => window.location.reload());

function initMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            pttBtn.disabled = false;
            statusText.textContent = "Siap Digunakan";
            statusText.className = "status ready";

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                socket.emit('audio-message', { room: currentRoom, audio: audioBlob });
                audioChunks = [];
                statusText.textContent = "Pesan Terkirim";
                setTimeout(() => statusText.textContent = "Siap Digunakan", 1000);
            };
        })
        .catch(err => {
            statusText.textContent = "Mikrofon Ditolak";
            statusText.className = "status error";
        });
}

socket.on('audio-broadcast', (audioData) => {
    statusText.textContent = "Menerima Suara...";
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    audioPlayback.src = URL.createObjectURL(audioBlob);
    audioPlayback.play();
});

const startRecording = (e) => {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state === "inactive") {
        mediaRecorder.start();
        pttBtn.classList.add('active');
        statusText.textContent = "Merekam...";
    }
};

const stopRecording = (e) => {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        pttBtn.classList.remove('active');
    }
};

pttBtn.addEventListener('mousedown', startRecording);
document.addEventListener('mouseup', stopRecording);
pttBtn.addEventListener('touchstart', startRecording, { passive: false });
document.addEventListener('touchend', stopRecording);
