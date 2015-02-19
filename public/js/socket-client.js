var socket = io();

socket.on('userupdate', function (data) {
    document.getElementById('numUsers').innerHTML = data;
});

// force newcomers in sync on existing clients' beat 0
socket.on('looptrigger', function () {
    if (isPlaying === false) {
        play();
    }
});

socket.on('new sequence', function (data) {
    sequence = (data);
    draw(true);        
});

socket.on('new tempo', function (data) {
    tempo = data;
    document.getElementById('showTempo').innerText = tempo;
    document.getElementById('tempo').value = tempo;
});

socket.on('broadcastedplay', function () {
    play();
});