// Hubungkan ke socket
const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

// Elemen DOM
const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge');
const userListDiv = document.getElementById('user-list');
let mediaRecorder;

// 1. FUNGSI UTAMA JOIN ROOM
function joinRoom(room, name) {
    // Kirim event join ke server
    socket.emit('join-room', { room, name });
    
    // Simpan ke localStorage agar tidak hilang saat refresh
    localStorage.setItem('wt_room', room);
    localStorage.setItem('wt_name', name);
    
    // Update Tampilan
    document.getElementById('display-room-code').textContent = room;
    roomScreen.classList.remove('active');
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
    wtScreen.classList.add('active');
    
    initMic(room);
}

// 2. CEK SESI SAAT REFRESH
window.onload = () => {
    const savedRoom = localStorage.getItem('wt_room');
    const savedName = localStorage.getItem('wt_name');
    if (savedRoom && savedName) {
        joinRoom(savedRoom, savedName);
    }
};

// 3. EVENT JOIN BARU
document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('user-name').value.trim() || "Anonim";
    const room = document.getElementById('room-code-input').value.trim();
    if (!room) return alert("Masukkan kode room!");
    joinRoom(room, name);
});

// 4. EVENT PINDAH ROOM
document.getElementById('switch-btn').addEventListener('click', () => {
    const newRoom = document.getElementById('new-room-input').value.trim();
    const name = localStorage.getItem('wt_name');
    if (!newRoom) return alert("Masukkan kode room baru!");
    
    // Pindah room
    joinRoom(newRoom, name);
});

// 5. LOGIKA MIKROFON & SOCKET
function initMic(room) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        pttBtn.disabled = false;
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { room, audio: e.data });
    }).catch(err => console.error("Mic Error:", err));
}

socket.on('update-user-list', (users) => {
    userListDiv.innerHTML = "<strong>Online:</strong> " + users.map(u => u.name).join(", ");
});

socket.on('user-count', (count) => {
    userBadge.textContent = `Online: ${count}`;
});

// PTT Events
const start = (e) => { e.preventDefault(); if(mediaRecorder && mediaRecorder.state === "inactive") { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Sedang Bicara..."; } };
const stop = (e) => { e.preventDefault(); if(mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap Digunakan"; } };

pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);
pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);

// Terima Audio
socket.on('audio-broadcast', (data) => {
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
});

// Keluar
document.getElementById('leave-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});
