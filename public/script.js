const socket = io("https://walkie-talkie-raincloud.up.railway.app", { transports: ['websocket'] });
const userListDiv = document.getElementById('user-list');
let mediaRecorder;

document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('user-name').value.trim() || "Anonim";
    const room = document.getElementById('room-code-input').value.trim();
    if (!room) return alert("Masukkan kode!");
    
    socket.emit('join-room', { room, name });
    document.getElementById('display-room-code').textContent = room;
    document.getElementById('room-screen').classList.remove('active');
    document.getElementById('wt-screen').classList.add('active');
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        document.getElementById('ptt-btn').disabled = false;
        mediaRecorder.ondataavailable = e => socket.emit('audio-message', { room, audio: e.data });
    });
});

socket.on('update-user-list', (users) => {
    userListDiv.innerHTML = "<strong>Online:</strong> " + users.map(u => u.name).join(", ");
});

const pttBtn = document.getElementById('ptt-btn');
const statusText = document.getElementById('status');

const start = (e) => { e.preventDefault(); if(mediaRecorder) { mediaRecorder.start(); pttBtn.classList.add('active'); statusText.textContent = "Sedang Bicara..."; } };
const stop = (e) => { e.preventDefault(); if(mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); pttBtn.classList.remove('active'); statusText.textContent = "Siap"; } };

pttBtn.addEventListener('touchstart', start, { passive: false });
pttBtn.addEventListener('touchend', stop);
pttBtn.addEventListener('mousedown', start);
pttBtn.addEventListener('mouseup', stop);

socket.on('audio-broadcast', (data) => {
    new Audio(URL.createObjectURL(new Blob([data]))).play();
    statusText.textContent = "Menerima Suara...";
    setTimeout(() => statusText.textContent = "Siap", 2000);
});

document.getElementById('leave-btn').addEventListener('click', () => window.location.reload());
