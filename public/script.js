const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge');
const userListDiv = document.getElementById('user-list');

let mediaRecorder;
let isAlwaysOn = false;

// 1. FUNGSI UTAMA JOIN ROOM
function joinRoom(room, name) {
    socket.emit('join-room', { room, name });
    localStorage.setItem('wt_room', room);
    localStorage.setItem('wt_name', name);
    
    document.getElementById('display-room-code').textContent = room;
    roomScreen.classList.remove('active');
    roomScreen.classList.add('hidden');
    wtScreen.classList.remove('hidden');
    wtScreen.classList.add('active');
    initMic(room);
}

window.onload = () => {
    const savedRoom = localStorage.getItem('wt_room');
    const savedName = localStorage.getItem('wt_name');
    if (savedRoom && savedName) joinRoom(savedRoom, savedName);
};

// 3 & 4. EVENT JOIN & SWITCH
document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('user-name').value.trim() || "Anonim";
    const room = document.getElementById('room-code-input').value.trim();
    if (!room) return alert("Masukkan kode!");
    joinRoom(room, name);
});

document.getElementById('switch-btn').addEventListener('click', () => {
    const newRoom = document.getElementById('new-room-input').value.trim();
    if (!newRoom) return alert("Masukkan kode room baru!");
    joinRoom(newRoom, localStorage.getItem('wt_name'));
});

// 5. MIC MODE
document.getElementById('mode-ptt').addEventListener('click', () => {
    isAlwaysOn = false;
    document.getElementById('mode-ptt').classList.add('active');
    document.getElementById('mode-always').classList.remove('active');
    pttBtn.style.display = "block";
    if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
    statusText.textContent = "Siap Digunakan";
});

document.getElementById('mode-always').addEventListener('click', () => {
    isAlwaysOn = true;
    document.getElementById('mode-ptt').classList.remove('active');
    document.getElementById('mode-always').classList.add('active');
    pttBtn.style.display = "none";
    statusText.textContent = "Mode Always On Aktif";
    if (mediaRecorder && mediaRecorder.state === "inactive") mediaRecorder.start(250);
});

// 6. LOGIKA MIKROFON
function initMic(room) {
    if (mediaRecorder) mediaRecorder.stream.getTracks().forEach(track => track.stop());
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
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

socket.on('audio-broadcast', (data) => {
    const audio = new Audio(URL.createObjectURL(new Blob([data])));
    audio.play();
});

// 8. PTT EVENTS
pttBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "inactive") {
        mediaRecorder.start(250);
        pttBtn.classList.add('active');
        statusText.textContent = "Sedang Bicara...";
    }
});

pttBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    if(mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        pttBtn.classList.remove('active');
        statusText.textContent = "Siap Digunakan";
    }
});

// 9. KELUAR
document.getElementById('leave-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});
