const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge');
const userListDiv = document.getElementById('user-list'); // Container daftar nama
let mediaRecorder;

// Join Room
document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('user-name').value.trim() || "Anonim";
    const room = document.getElementById('room-code-input').value.trim();
    
    if (!room) return alert("Masukkan kode room!");
    
    // Kirim objek {room, name} ke server
    socket.emit('join-room', { room, name });
    
    document.getElementById('display-room-code').textContent = room;
    
    roomScreen.classList.remove('active');
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
    wtScreen.classList.add('active');
    
    initMic(room);
});

// Update jumlah user & daftar nama secara Realtime
socket.on('user-count', (count) => {
    userBadge.textContent = `Online: ${count}`;
});

socket.on('update-user-list', (users) => {
    // Menampilkan daftar nama di dalam div user-list
    userListDiv.innerHTML = "<strong>Online:</strong> " + users.map(u => u.name).join(", ");
});

// Setup Mic
function initMic(room) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        pttBtn.disabled = false;
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { room, audio: e.data });
    }).catch(err => alert("Mikrofon tidak diizinkan!"));
}

// PTT Events dengan Animasi
const start = (e) => { 
    e.preventDefault(); 
    if(mediaRecorder && mediaRecorder.state === "inactive") { 
        mediaRecorder.start(); 
        pttBtn.classList.add('active'); 
        statusText.textContent = "Sedang Bicara..."; 
        statusText.classList.add('active'); 
    } 
};

const stop = (e) => { 
    e.preventDefault(); 
    if(mediaRecorder && mediaRecorder.state === "recording") { 
        mediaRecorder.stop(); 
        pttBtn.classList.remove('active'); 
        statusText.textContent = "Siap Digunakan"; 
        statusText.classList.remove('active'); 
    } 
};

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
