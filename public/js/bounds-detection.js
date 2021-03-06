var boundsDetection = function(posX, posY, box, button, evt) {

    var x = Math.floor(posX/(box))-1;
    var y = Math.floor(posY/(box))-1;

    if (x>=0 && x<=15 && y>=0 && y<=4) {

        if (sequence[y][x] === 0) {
            sequence[y][x] = button;
        }
        else if (button === 2 && sequence[y][x] === 1) {
            sequence[y][x] = 2;
        }
        else {
            sequence[y][x] = 0;
        }

        draw(true);
        socket.emit('new sequence', sequence);
        putJSON(sequence, tempo);
    }  
};