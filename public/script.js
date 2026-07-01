const socket = io("https://walkie-talkie-production-fe10.up.railway.app");

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

joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    if (code === "") return alert("Masukkan kode room!");

    joinBtn.disabled = true;
    loadingText.classList.remove('hidden');

    setTimeout(() => {
        currentRoom = code;
        displayRoomCode.textContent = currentRoom;
        
        socket.emit('join-room', currentRoom);

        roomScreen.classList.remove('active');
        roomScreen.classList.add('hidden');
        wtScreen.classList.remove('hidden');
        wtScreen.classList.add('active');

        joinBtn.disabled = false;
        loadingText.classList.add('hidden');
        roomCodeInput.value = "";

        initMicrophone();
    }, 1000); 
});

leaveBtn.addEventListener('click', () => {
    window.location.reload(); 
});

function initMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            pttBtn.disabled = false;
            statusText.textContent = "Siap Digunakan";
            statusText.className = "status ready";

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                socket.emit('audio-message', {
                    room: currentRoom,
                    audio: audioBlob
                });

                audioChunks = []; 
                statusText.textContent = "Pesan Terkirim";
                
                setTimeout(() => {
                    if(statusText.textContent === "Pesan Terkirim") {
                        statusText.textContent = "Siap Digunakan";
                        statusText.className = "status ready";
                    }
                }, 1000);
            };
        })
        .catch(err => {
            console.error("Mic Ditolak:", err);
            statusText.textContent = "Mikrofon Ditolak";
            statusText.className = "status error";
        });
}

socket.on('audio-broadcast', (audioData) => {
    statusText.textContent = "Menerima Suara...";
    statusText.className = "status playing";

    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    audioPlayback.src = audioUrl;
    audioPlayback.play();
});

audioPlayback.onended = () => {
    statusText.textContent = "Siap Digunakan";
    statusText.className = "status ready";
};

const startRecording = (e) => {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state === "inactive") {
        mediaRecorder.start();
        pttBtn.classList.add('active');
        statusText.textContent = "Merekam (Bicara)...";
        statusText.className = "status recording";
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
