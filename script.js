"use strict";

var _audioCtx = new (window.webkitAudioContext || window.AudioContext)();
var _note = [];  // [key.id][harmonic]
var _harm = 10;  // harmonic series: 1 fundamental and 9 overtones
var _gain =
[
  1.00,  // 0 = fundamental
  0.50,  // 1st overtone, -6
  0.28,  // 2nd overtone, -11
  0.07,  // 3rd overtone, -23
  0.15,  // 4th overtone, -16
  0.20,  // 5th overtone, -14
  0.04,  // 6th overtone, -27
  0.02,  // 7th overtone, -32
  0.00,  // 8th overtone, -50
  0.06,  // 9th overtone, -24
];
var _freq =
[
  261.63,  // 0 = C4
  277.18,  // 1 = C4 Sharp
  293.66,  // 2 = D4
  311.13,  // 3 = D4 Sharp
  329.63,  // 4 = E4
  349.23,  // 5 = F4
  369.99,  // 6 = F4 Sharp
  392.00,  // 7 = G4
  415.30,  // 8 = G4 Sharp
  440.00,  // 9 = A4
  466.16,  // 10 = A4 Sharp
  493.88,  // 11 = B4
  523.25,  // 12 = C5
  554.37,  // 13 = C5 Sharp
  587.33,  // 14 = D5
  622.25,  // 15 = D5 Sharp
  659.26   // 16 = E5
];


window.onload = function()
{

/*----------------ELEMENTS&LISTENERS----------------*/

//  var tDisp = document.getElementById("target_disp");
//  var xDisp = document.getElementById("x_disp");

  var octUpBtn = document.getElementById("oct_up");
  var octDownBtn = document.getElementById("oct_down");
  var octDisplay = document.getElementById("oct_disp");

  var glissOn = false;
  var glissBtn = document.getElementById("gliss_btn");
  var glissBar = document.getElementById("gliss_bar");

  var resetBtn = document.getElementById("reset_btn");
  var keys = document.getElementsByClassName("keys");

  octUpBtn.addEventListener("click", octUp);
  octDownBtn.addEventListener("click", octDown);
  glissBtn.addEventListener("click", glissToggle);
  glissBar.addEventListener("click", glissToggle);
  resetBtn.addEventListener("click", resetSynth);

  document.addEventListener("touchmove", onGliss);
  document.addEventListener("touchend", onGlissOver);

  for (var n = 0; n < keys.length; n++)
  {
    keys[n].addEventListener("touchstart", onPressKey);
    keys[n].addEventListener("touchend", onReleaseKey);
    keys[n].addEventListener("touchcancel", onReleaseKey);

    keys[n].addEventListener("mousedown", onPressKey);
    keys[n].addEventListener("mouseup", onReleaseKey);
    keys[n].addEventListener("mouseleave", onReleaseKey);

    _note[n] = [undefined];
  }

/*----------------GAIN-CONTROLS----------------*/

  var anls = _audioCtx.createAnalyser();
  anls.connect(_audioCtx.destination);

  var comp = _audioCtx.createDynamicsCompressor();
  comp.threshold.value = -50;
  comp.knee.value = 20;
  comp.ratio.value = 12;
  comp.attack.value = 0;
  comp.release.value = 0.5;
  comp.connect(anls);

  var gainCtrl = [];
  for (var h = 0; h < _harm; h++)
  {
    gainCtrl[h] = _audioCtx.createGain();
    gainCtrl[h].gain.value = _gain[h];
    gainCtrl[h].connect(comp);
  }

/*----------------EVENTS&METHODS----------------*/

function octUp()
{
  octDownBtn.disabled = false;
  if (octDisplay.innerHTML < 8) octDisplay.innerHTML++;
  if (octDisplay.innerHTML == 8) octUpBtn.disabled = true;
}

function octDown()
{
  octUpBtn.disabled = false;
  if (octDisplay.innerHTML > 0) octDisplay.innerHTML--;
  if (octDisplay.innerHTML == 0) octDownBtn.disabled = true;
}

function glissToggle()
{
  if (glissOn)
  {
    glissBar.style.background = "grey";
    glissBtn.style = "margin-left:0px";
    glissOn = false;
  }
  else
  {
    glissBar.style.background = "lime";
    glissBtn.style = "margin-left:15px";
    glissOn = true;
  }
}

function resetSynth()
{
  octUpBtn.disabled = false;
  octDownBtn.disabled = false;
  octDisplay.innerHTML = 4;

  glissBar.style.background = "grey";
  glissBtn.style = "margin-left:0px";
  glissOn = false;

  for (var n = 0; n < keys.length; n++)
    noteOff(keys[n]);
}

var lastElm = undefined;

function onGliss(event)
{
  event.preventDefault();

  var x = event.changedTouches[0].clientX;
  var y = event.changedTouches[0].clientY;
  var base = document.getElementById("synthesizer").offsetLeft;
  var curElm = document.elementFromPoint(x, y);
  if (lastElm == undefined)
    lastElm = event.target;

  if (event.target.classList.contains("keys"))
    if (glissOn)
    {
//      tDisp.innerHTML = curElm.id;
//      xDisp.innerHTML = x - 30 - base;
      if (curElm.classList.contains("keys") && (curElm != lastElm))
      {
        noteOff(lastElm);
        noteOn(curElm);
        lastElm = curElm;
      }
    }
    else
    {
      if (curElm.id != event.target.id)
        noteOff(event.target);
    }
}

function onGlissOver(event)
{
  if (glissOn && (lastElm != undefined))
  {
//    tDisp.innerHTML = lastElm.id;
    noteOff(lastElm);
    lastElm = undefined;
  }
}

function onPressKey()
{
  noteOn(this);
}

function onReleaseKey()
{
  noteOff(this);
}

function noteOn(key)
{
  var oct = octDisplay.innerHTML;

  if ((key != undefined) && key.classList.contains("keys"))
  {
    if (key.classList.contains("white_key"))
      key.classList.add("pressed_white_key");
    else if (key.classList.contains("black_key"))
      key.classList.add("pressed_black_key");

    if (_note[key.id][0] == undefined)
    {
      for (var h = 0; h < _harm; h++)
      {
        var fundFreq = _freq[key.id] * Math.pow(2, oct-4);

        _note[key.id][h] = _audioCtx.createOscillator();
        _note[key.id][h].type = "sine";
        _note[key.id][h].frequency.value = fundFreq * (h+1);
        _note[key.id][h].connect(gainCtrl[h]);
        _note[key.id][h].start(_audioCtx.currentTime);
      }
    }
  }
}

function noteOff(key)
{
  if ((key != undefined) && key.classList.contains("keys"))
  {
    key.classList.remove("pressed_white_key");
    key.classList.remove("pressed_black_key");

    if (_note[key.id][0] != undefined)
    {
      for (var h = 0; h < _harm; h++)
      {
        _note[key.id][h].disconnect();
        _note[key.id][h].stop(_audioCtx.currentTime);
        _note[key.id][h] = undefined;
      }
    }
  }
}

var canvas = document.getElementById('analyser');
var graph = canvas.getContext('2d');

anls.fftSize = 4096;
var data = new Uint8Array(anls.frequencyBinCount);
//console.log(anls.frequencyBinCount);
//console.log(data.length);

freqAnalyser();

function freqAnalyser()
{
  (window.requestAnimationFrame || window.webkitRequestAnimationFrame)(freqAnalyser);

  var w = canvas.width;
  var h = canvas.height;
  var x, y;

  graph.clearRect(0, 0, w, h);
  graph.beginPath();
  graph.moveTo(1 / Math.log10(data.length) * w, 0);
  graph.lineTo(1 / Math.log10(data.length) * w, h);
  graph.moveTo(2 / Math.log10(data.length) * w, 0);
  graph.lineTo(2 / Math.log10(data.length) * w, h);
  graph.moveTo(3 / Math.log10(data.length) * w, 0);
  graph.lineTo(3 / Math.log10(data.length) * w, h);
  graph.strokeStyle = "red";
  graph.stroke();

  anls.getByteFrequencyData(data);
  graph.beginPath();
  graph.moveTo(0, h);

  for (var i = 0; i < data.length; i++)
  {
    x = Math.log10(i+1) / Math.log10(data.length) * w;
    y = (1 - data[i] / 256) * h + 5;
    graph.lineTo(x, y);
  }

  graph.strokeStyle = "white";
  graph.stroke();
}

};
