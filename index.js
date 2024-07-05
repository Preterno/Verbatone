var audio;
var playing = false,
  isPaused = false;
var voices;
var durationTime = 0,
  elapsedTime = 0,
  minutes,
  seconds,
  m,
  s,
  value,
  startTime;
var prevText = "";

$(".audio-player").hide();
$("#play").hide();

function generateAudio(text) {
  audio = new SpeechSynthesisUtterance(text);
}

// window.speechSynthesis.onvoiceschanged = function () {
//   voices = window.speechSynthesis.getVoices();
// };

function updateTimer() {
  elapsedTime = parseInt((performance.now() - startTime) / 1000);
  minutes = parseInt(elapsedTime / 60);
  seconds = elapsedTime % 60;

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  if (durationTime === 0) {
    $("#duration").text(minutes + ":" + seconds);
  } else {
    $("#duration").text(minutes + ":" + seconds + " / " + m + ":" + s);
  }

  if (durationTime !== 0) {
    if (elapsedTime > 0) {
      value = Math.floor((100 / durationTime) * elapsedTime);
    }
  } else {
    if (seconds % 2 === 1) {
      value = 93;
    } else {
      value = 95;
    }
  }
  if (value > 100) {
    value = 100;
  }
  $(".progress").css("width", value + "%");
}

function audioPlayer() {
  if (playing) {
    console.log("Already playing");
    return;
  }

  var text = $("textarea#textinput").val();
  if (!text) {
    console.log("No text");
    return;
  }

  generateAudio(text);
  $(".progress").css("width", "0%");
  if (durationTime && text === prevText) {
    $("#duration").text("0:00 / " + m + ":" + s);
  } else {
    initialize();
  }
  $(".audio-player").show();
  // audio.voice = voices[1];
  audio.volume = 1;
  speechSynthesis.speak(audio);
  startTime = performance.now();
  playing = true;

  let timerInterval = setInterval(function () {
    if (!isPaused && speechSynthesis.speaking) {
      updateTimer();
    }
  }, 1000);

  audio.onend = function () {
    console.log("Speech ended. Timer stopped.");
    durationTime = elapsedTime;
    m = Math.floor(durationTime / 60);
    s = durationTime % 60;
    if (s < 10) {
      s = "0" + s;
    }
    $("#duration").text(minutes + ":" + seconds + " / " + m + ":" + s);
    clearInterval(timerInterval);
    playing = false;
    prevText = text;
    $("#pause").hide();
    $("#play").show();
  };
}

$("#play").on("click", function () {
  $("#play").hide();
  $("#pause").show();
  if (durationTime === elapsedTime) {
    audioPlayer();
  } else {
    speechSynthesis.resume();
    startTime = performance.now() - (elapsedTime * 1000) - 850;
  }
  isPaused = false;
});

$("#pause").on("click", function () {
  speechSynthesis.pause();
  isPaused = true;
  $("#pause").hide();
  $("#play").show();
});

$("#clear").on("click", function () {
  $("textarea#textinput").val("");
  clear();
});

$('textarea#textinput').bind('input propertychange', function() {
    if(playing){
        clear();
    }
});

function clear(){
    speechSynthesis.cancel();
  $(".audio-player").hide();
  initialize();
}

function initialize() {
  $("#play").hide();
  $("#pause").show();
  playing = false;
  isPaused = false;
  durationTime = 0;
  elapsedTime = 0;
  minutes = 0;
  seconds = 0;
  m = 0;
  s = 0;
  value = 0;
  $(".progress").css("width", "0%");
  $("#duration").text("0:00");
}

