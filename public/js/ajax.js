var getJSON = function(callback, path) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
    	if (xhr.readyState === 4) {
	        if (xhr.status >= 200 && xhr.status < 400) {

	        	var resp = JSON.parse(xhr.responseText);

	        	var obj = {
	        		data:  resp[0].data[0],
	        		tempo: resp[0].tempo
	        	};

        		var splitArrays = [];

        		var a = obj.data.split(',').map(Number); //convert string into one big number array

        		while(a.length > 0) {
        			splitArrays.push(a.splice(0, 16)); //splice into 5x16 sequence array format
        		}

	        	sequence = splitArrays;
	        	tempo = obj.tempo;

	        	document.getElementById('showTempo').innerText = tempo;
	        	document.getElementById('tempo').value = tempo;

	        	if (callback) callback(); //call draw function
	        }
	    }
    }
    xhr.open('GET', '/api', true);
    xhr.send();
};



var putJSON = function(seq, temp) {
	var xhr = new XMLHttpRequest();
	xhr.open('PUT', '/api/54b9706a45a04dd915987f6a', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	xhr.send('data='+seq+'&tempo='+temp);
};