var audio;
var playing = false,
  isPaused = false;
var voices = [];
var durationTime = 0,
  elapsedTime = 0,
  minutes,
  seconds,
  m,
  s,
  value,
  startTime;
var prevText = "";
var isText = true;

$(".audio-player").hide();
$("#play").hide();

function generateAudio(text) {
  audio = new SpeechSynthesisUtterance(text);
}

window.speechSynthesis.onvoiceschanged = function () {
  voices = window.speechSynthesis.getVoices();
};

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

async function audioPlayer() {
  if (playing) {
    console.log("Already playing");
    return;
  }

  var text;
  if (isText) {
    text = $("textarea#textinput").val();
  } else {
    try {
      text = await fileData();
      console.log("Extracted Text:", text);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
    }
  }

  if (!text) {
    console.log("Enter text");
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
  $("#play").hide();
  $("#pause").show();

  if (voices.length > 1) {
    audio.voice = voices[1];
  }
  audio.volume = 1;
  speechSynthesis.speak(audio);
  startTime = performance.now();
  playing = true;

  var timerInterval = setInterval(function () {
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
  isPaused = false;
  if (durationTime === elapsedTime) {
    audioPlayer();
  } else {
    playing = true;
    speechSynthesis.resume();
    startTime = performance.now() - elapsedTime * 1000 - 850;
  }
});

$("#pause").on("click", function () {
  speechSynthesis.pause();
  isPaused = true;
  playing = false;
  $("#pause").hide();
  $("#play").show();
});

$("#clear").on("click", function () {
  $("textarea#textinput").val("");
  clear();
  if (!isText) {
    $("#file-input").val("");
    $("label img").show();
    $("label p").text("Choose a file.");
  }
});

$("textarea#textinput").bind("input propertychange", function () {
  clear();
});

function clear() {
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

// For file upload
$(".file-box").hide();

$("#text-input").on("click", function () {
  if (!isText) {
    isText = true;
    clear();
    $("#textinput").show();
    $(".file-box").hide();
  }
});

$("#file-upload").on("click", function () {
  if (isText) {
    isText = false;
    clear();
    $(".file-box").show();
    $("#textinput").hide();
  }
});

function fileName() {
  file = $("#file-input").prop("files");
  console.log(file[0].name);
  $("label img").hide();
  $("label p").text(file[0].name + " is selected.");
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";

async function fileData() {
  var selectedFile = $("#file-input")[0].files[0];
  if (selectedFile == undefined) {
    console.log("File error");
    return;
  }

  var reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = function () {
      var allText = "";

      pdfjsLib
        .getDocument({ data: new Uint8Array(reader.result) })
        .promise.then(function (pdf) {
          console.log(pdf.numPages);

          var pagePromises = [];

          for (var pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            var pagePromise = pdf.getPage(pageNo).then(function (page) {
              return page.getTextContent().then(function (textContent) {
                var text = "";
                for (var i = 0; i < textContent.items.length; i++) {
                  text += textContent.items[i].str;
                }
                return text;
              });
            });
            pagePromises.push(pagePromise);
          }

          Promise.all(pagePromises)
            .then(function (texts) {
              allText = texts.join("");
              resolve(allText);
            })
            .catch(reject);
        })
        .catch(reject);
    };

    reader.onerror = reject; 
    reader.readAsArrayBuffer(selectedFile);
  });
}
