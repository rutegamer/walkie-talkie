const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });

const roomScreen = document.getElementById('room-screen');
const wtScreen = document.getElementById('wt-screen');
const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');
const userBadge = document.getElementById('user-badge');
const userListDiv = document.getElementById('user-list');

let mediaRecorder;
let isAlwaysOn = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

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
    
    // Aktivasi AudioContext agar browser mengizinkan suara masuk
    if (audioContext.state === 'suspended') audioContext.resume();
    
    initMic(room);
}

// 2. CEK SESI
window.onload = () => {
    const savedRoom = localStorage.getItem('wt_room');
    const savedName = localStorage.getItem('wt_name');
    if (savedRoom && savedName) joinRoom(savedRoom, savedName);
};

// 3. EVENT JOIN & SWITCH
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

// 4. MIC MODE
document.getElementById('mode-ptt').addEventListener('click', () => {
    isAlwaysOn = false;
    document.getElementById('mode-ptt').classList.add('active');
    document.getElementById('mode-always').classList.remove('active');
    pttBtn.style.display = "block";
    if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
});

document.getElementById('mode-always').addEventListener('click', () => {
    isAlwaysOn = true;
    document.getElementById('mode-ptt').classList.remove('active');
    document.getElementById('mode-always').classList.add('active');
    pttBtn.style.display = "none";
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.start(250); 
    }
});

// 5. LOGIKA MIKROFON
function initMic(room) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        pttBtn.disabled = false;
        
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) socket.emit('audio-message', { room, audio: e.data });
        };
    }).catch(err => alert("Izin mikrofon gagal: " + err));
}

// 6. SOCKET LISTENERS
socket.on('update-user-list', (users) => {
    userListDiv.innerHTML = "<strong>Online:</strong> " + users.map(u => u.name).join(", ");
});

socket.on('audio-broadcast', (data) => {
    // Memutar audio dengan blob
    const audioBlob = new Blob([data], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Perbaikan auto-play
    audio.play().catch(e => {
        console.warn("Auto-play diblokir, mohon klik layar");
        document.addEventListener('click', () => audio.play(), { once: true });
    });
});

// 7. PTT EVENTS
const start = (e) => { 
    e.preventDefault(); 
    if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "inactive") { 
        mediaRecorder.start(250); 
        pttBtn.classList.add('active'); 
    } 
};
const stop = (e) => { 
    e.preventDefault(); 
    if(!isAlwaysOn && mediaRecorder && mediaRecorder.state === "recording") { 
        mediaRecorder.stop(); 
        pttBtn.classList.remove('active'); 
    } 
};

pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);
pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);

document.getElementById('leave-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});
