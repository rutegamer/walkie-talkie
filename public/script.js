const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

// Elemen DOM
const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge');
const userListDiv = document.getElementById('user-list');

// Variabel Mic Mode
let mediaRecorder;
let isAlwaysOn = false;
let autoRecordInterval;

// 1. FUNGSI UTAMA JOIN ROOM
function joinRoom(room, name) {
    socket.emit('join-room', { room, name });
    
    // Simpan sesi
    localStorage.setItem('wt_room', room);
    localStorage.setItem('wt_name', name);
    
    // Tampilan
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
    if (savedRoom && savedName) joinRoom(savedRoom, savedName);
};

// 3. EVENT JOIN
document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('user-name').value.trim() || "Anonim";
    const room = document.getElementById('room-code-input').value.trim();
    if (!room) return alert("Masukkan kode!");
    joinRoom(room, name);
});

// 4. EVENT PINDAH ROOM
document.getElementById('switch-btn').addEventListener('click', () => {
    const newRoom = document.getElementById('new-room-input').value.trim();
    const name = localStorage.getItem('wt_name');
    if (!newRoom) return alert("Masukkan kode room baru!");
    joinRoom(newRoom, name);
});

// 5. MIC MODE (Always On Anti-Delay)
function startAlwaysOn() {
    clearInterval(autoRecordInterval);
    // Hapus setInterval lama jika ada, gunakan start(250) langsung di MediaRecorder
    if (mediaRecorder && mediaRecorder.state === "inactive") {
        mediaRecorder.start(250); 
    }
}

// 6. LOGIKA MIKROFON (Optimasi Codec)
function initMic(room) {
    if (mediaRecorder) mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        // Tambahkan codec opus agar lebih ringan dan cepat
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        pttBtn.disabled = false;
        
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) socket.emit('audio-message', { room, audio: e.data });
        };
    }).catch(err => console.error("Mic Error:", err));
}

// 7. SOCKET LISTENERS
socket.on('update-user-list', (users) => {
    userListDiv.innerHTML = "<strong>Online:</strong> " + users.map(u => u.name).join(", ");
});

socket.on('user-count', (count) => {
    userBadge.textContent = `Online: ${count}`;
});

socket.on('audio-broadcast', (data) => {
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
    statusText.textContent = "Menerima Suara...";
    setTimeout(() => statusText.textContent = "Siap Digunakan", 1000);
});

// 8. PTT EVENTS
const start = (e) => { 
    e.preventDefault(); 
    // Pastikan hanya berjalan jika mode Always On tidak aktif
    if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "inactive") { 
        mediaRecorder.start(250); 
        pttBtn.classList.add('active'); 
        statusText.textContent = "Sedang Bicara..."; 
    } 
};

const stop = (e) => { 
    e.preventDefault(); 
    // Hentikan rekaman saat tombol dilepas
    if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "recording") { 
        mediaRecorder.stop(); 
        pttBtn.classList.remove('active'); 
        statusText.textContent = "Siap Digunakan"; 
    } 
};
if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "inactive") { 
    mediaRecorder.start(250); // PTT sekarang juga pakai timeslice 250ms
    pttBtn.classList.add('active'); 
    statusText.textContent = "Sedang Bicara..."; 
}


// 9. KELUAR
document.getElementById('leave-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});

