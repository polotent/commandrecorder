let gumStream;

navigator.mediaDevices.getUserMedia({audio: true, video:false}).then(stream => {
  audioContext = new AudioContext();
  gumStream = stream;
  input = audioContext.createMediaStreamSource(stream);
  recorder = new Recorder(input,{numChannels:1});
});

let button = document.getElementById('record-button');
let recordingBuff;
let commands = {};
let recordings = {};
let idIter = 0;
let dictIdIter = 0;
let state = 'idle';
let recordingsTableBody = document.getElementById('recordings-table').querySelector("tbody");
let commandsDictTableBody = document.getElementById('command-dict-table').querySelector("tbody");
let commandInput = document.getElementById('command-input');

function addRecord(blob){
  let htmlRow = "<tr id='row-"+idIter+"'><td>"+idIter+"</td><td>"+commandInput.value.trim()+"</td><td><audio id='audio-"+idIter+"'></audio></td><td><img id='delete-button-"+idIter+"' class='delete-button' src='/img/delete.png'></td></tr>";
  recordingsTableBody.insertAdjacentHTML("afterbegin", htmlRow);
  recordings[idIter] = {
    "command" : commandInput.value.trim(),
    "data" : blob,
    "audio" : document.getElementById('audio-' + idIter),
    "delButton" : document.getElementById('delete-button-' + idIter)
  };

  recordings[idIter]["delButton"].onclick = e => {
    deleteRecord(e.target.id);
  }

  if (commandInput.value.trim() in commands){
    let quantity = document.getElementById('record-quantity-' + commands[commandInput.value.trim()]["dictId"]);
    commands[commandInput.value.trim()]["quantity"] += 1;
    quantity.innerHTML = commands[commandInput.value.trim()]["quantity"];
  } else {
    commands[commandInput.value.trim()] = {
      "dictId" : dictIdIter,
      "quantity" : 1,
    }
    let htmlRow = "<tr id='dict-row-"+dictIdIter+"'><td>"+commandInput.value.trim()+"</td><td id='record-quantity-"+dictIdIter+"'>1</td></tr>";
    commandsDictTableBody.insertAdjacentHTML("afterbegin", htmlRow);
    dictIdIter += 1;
  }  

  recordings[idIter]["audio"].src = URL.createObjectURL(recordings[idIter]["data"]);
  recordings[idIter]["audio"].controls=true;
  recordings[idIter]["audio"].autoplay=false;
  
  idIter += 1;
}

function deleteRecord(elID){
  let temp = elID.split("-");
  let id = temp[temp.length - 1];
  let row = document.getElementById('row-' + id);
  row.remove();
  commands[recordings[id]["command"]]["quantity"] -= 1;
  let quantity = commands[recordings[id]["command"]]["quantity"];
  if (quantity == 0){
    row = document.getElementById('dict-row-'+commands[recordings[id]["command"]]["dictId"]); 
    row.remove();
    delete commands[recordings[id]["command"]];
  } else {    
    row = document.getElementById('record-quantity-'+commands[recordings[id]["command"]]["dictId"]); 
    row.innerHTML = quantity;
  }
  
  delete recordings[id];
}

button.onclick = e => {
    if (state == 'idle'){
      if (commandInput.value.trim()){
        commandInput.setAttribute('readonly', true); 
        state = 'recording';
        button.setAttribute('src', '/img/stop.png');
        recordingBuff = [];
        recorder.record();
      }
    } else {
      state = 'idle';
      commandInput.removeAttribute('readonly');
      button.setAttribute('src', '/img/record.png');

      recorder.stop();
      gumStream.getAudioTracks()[0].stop();
      recorder.exportWAV(addRecord);
      recorder.clear();
    }    
}

let downloadButton = document.getElementById("download-button");
downloadButton.onclick = e => {
  let iter = 0;
  let zip = new JSZip();
  if (Object.keys(recordings).length) {
    for (let recording of Object.values(recordings)){
      zip.file('file'+iter+'.wav', recording.data);
      iter += 1;
    }
    zip.generateAsync({type:"blob"})
    .then(function(content) {
      saveAs(content, "data.zip");
    });
  } 
}
