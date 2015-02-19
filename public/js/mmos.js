var audioContext = null;
var audioContext;
var bufferLoader;
var canvas;
var canvasContext;

var isPlaying = false;
var startTime;              // The start time of the entire sequence.
var current16thNote;        // What note is currently last scheduled?

var tempo = 120.0;
var noteLength = 0.30;

var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var intervalID = 0;         // setInterval identifier.
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}

var noteColor = ["grey", "orange", "yellow"];

var sequence = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [0,0,1,0,0,0,1,2,0,0,0,0,0,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
];


// setTimeout fallback
(window.requestAnimFrame = function(){
    return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
}());

var clearSequence = function() {
    sequence = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];
    draw(true);
};

var getMousePos = function(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
};

var nextNote = function() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
                                          // tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    current16thNote += 1;    // Advance the beat number, wrap to zero
    if (current16thNote === 16) {
        current16thNote = 0;
    }
};

var playAudio = function(bufferList) {};


var playSound = function(buffer, time) {
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);
    source.stop(time + noteLength);
};


var scheduleNote = function(beatNumber, time) {
    var halfBeat = 0.125 * 60.0 / tempo;

    // push the note on the queue, even if not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if (beatNumber === 0) {
        socket.emit('loop'); //for syncing new users
    }


    if (sequence[4][beatNumber] !== 0) {

        playSound(bufferLoader.bufferList[0], time);

        if (sequence[4][beatNumber] === 2) {
            playSound(bufferLoader.bufferList[0], time + halfBeat);
        }
    }
    if (sequence[3][beatNumber] !== 0) {

        playSound(bufferLoader.bufferList[1], time);

        if (sequence[3][beatNumber] === 2) {
            playSound(bufferLoader.bufferList[1], time + halfBeat);
        }
    }
    if (sequence[2][beatNumber] !== 0) {

        playSound(bufferLoader.bufferList[2], time);

        if (sequence[2][beatNumber] === 2) {
            playSound(bufferLoader.bufferList[2], time + halfBeat);
        }
    }
    if (sequence[1][beatNumber] !== 0) {

        playSound(bufferLoader.bufferList[3], time);

        if (sequence[1][beatNumber] === 2) {
            playSound(bufferLoader.bufferList[3], time + halfBeat);
        }
    }
    if (sequence[0][beatNumber] !== 0) {

        playSound(bufferLoader.bufferList[4], time);

        if (sequence[0][beatNumber] === 2) {
            playSound(bufferLoader.bufferList[4], time + halfBeat);
        }
    }
};

var scheduler = function() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance to next note
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( current16thNote, nextNoteTime );
        nextNote();
    }
    timerID = window.setTimeout( scheduler, lookahead );
};

var play = function() {
    isPlaying = !isPlaying;

    if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        document.getElementById('playButton').innerHTML = "<i class='fa fa-stop'></i>"+"stop";
    } else {
        window.clearTimeout( timerID );
        document.getElementById('playButton').innerHTML = "<i class='fa fa-play'></i>"+"play";
    }
};

// play via spacebar
var onKeyDown = function(e){
    if (e.keyCode === 32 || e.keyCode === 13) {
        socket.emit('playpress');
        play();
    } else if (e.keyCode === 46) {
        clearSequence();
    }
};

var resizeCanvas = function(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth/2.8;
    draw(true);
    window.scrollTo(0,0); // scroll to the top left.
};

var draw = function(forceDraw) {
    var currentNote = last16thNoteDrawn;
    var currentTime = audioContext.currentTime;

    while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        currentNote = notesInQueue[0].note;
        notesInQueue.splice(0,1);   // remove note from queue
    }   
    
    if (last16thNoteDrawn != currentNote || forceDraw === true) {

        var box = Math.floor( canvas.width / 18 );

        canvasContext.clearRect(0,0,canvas.width, canvas.height); 
        canvasContext.lineWidth = 3;

        for (var r = 0; r<5; r++) { //vertical
            for (var i = 0; i<16; i++) { //horizontal

                if (currentNote === i) { // highlighting the current note
                    if (sequence[r][currentNote] === 0) {
                        canvasContext.strokeStyle = "pink";
                    } else {canvasContext.strokeStyle = "red";}
                } else {canvasContext.strokeStyle = "white";}
                canvasContext.strokeRect( box * (i+1), box*(r+1), box*0.9, box*0.9 );

                canvasContext.fillStyle = noteColor[sequence[r][i]];
                canvasContext.fillRect( box * (i+1), box*(r+1), box*0.9, box*0.9 );

                if (r === 0) {
                    canvasContext.fillStyle = "grey";
                    canvasContext.fillText( i+1, box * (i+1), box*0.8 );
                }
            }
        }

        last16thNoteDrawn = currentNote;
    }
    // set up to draw again
    requestAnimFrame(draw);
};




var init = function(){
    var container = document.getElementById('container');

    canvas = document.createElement('canvas');
    canvasContext = canvas.getContext('2d');
    canvas.width = window.innerWidth; 
    canvas.height = window.innerWidth/2.8; 

    container.appendChild(canvas);  


    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();


    //request drum samples via buffer-loader.js
    bufferLoader = new BufferLoader(
        audioContext,
        [
          "samples/kick.wav",
          "samples/snare.wav",
          "samples/clap.wav",
          "samples/hh.wav",
          "samples/hho.wav",
        ],
        playAudio
    );
    bufferLoader.load();


 
    // listen for keyboard
    window.addEventListener("keydown", onKeyDown);



    // update note length via slider
    document.getElementById('noteLength').oninput=function(){
        noteLength = this.value*1;
        document.getElementById('showNoteLength').innerHTML = noteLength.toFixed(2);
    };

    // update tempo via slider
    document.getElementById('tempo').oninput=function(){
        document.getElementById('showTempo').innerText = this.value;

        //only update value when released
        this.onchange=function() {
            socket.emit('new tempo', this.value);
            tempo = this.value;
            putJSON(sequence, tempo);
        }
    };


    // toggle note
    canvas.addEventListener('mousedown', function(evt) {
        var pos = getMousePos(canvas, evt);
        var posX = pos.x;
        var posY = pos.y;
        var box = Math.floor(canvas.width/18);
        var button = 1;

        
        switch (evt.which) {
            case 1: button = 1; break; //left click
            case 3: button = 2; break; //right click
        }
        if (window.event.ctrlKey) {
            button = 2;
        }

        boundsDetection(posX, posY, box, button);

        draw(true);

    }, false);


    window.onorientationchange = resizeCanvas;
    window.onresize = resizeCanvas;

    // get pattern from database then draw
    getJSON(function(){
        requestAnimFrame(draw); // start the drawing loop.
        draw(true);
    });
};

window.addEventListener('load', init );