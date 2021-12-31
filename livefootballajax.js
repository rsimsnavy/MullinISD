var time = 900;
//0 stop, 1 running, 2 reset phase
var running = 0;
var flag = 0;

var spyfoul = 0;

//variabili per non continuare a perdere tempo a cercare riferimenti nell'html
var team1Element = document.getElementById('team_1');
var team2Element = document.getElementById('team_2');
var points1Element = document.getElementById('points_1');
var points2Element = document.getElementById('points_2');
var momentElement = document.getElementById('moment');
var timerElement = document.getElementById('timer');
var overtimeElement = document.getElementById('overtime');
var attemptsElement = document.getElementById('attempts');
var suffixElement = document.getElementById('suffixattempts');
var yardsElement = document.getElementById('yards');
var ovtElement = document.getElementById('ovt');
var foulSignalElement = document.getElementById('foulsignal');
var listHomeTimeouts = [];
var listAwayTimeouts = [];
var nextCycle = 1;

for (let k = 1; k < 6; k++) {
    listHomeTimeouts.push(document.getElementById('ht' + k));
    listAwayTimeouts.push(document.getElementById('at' + k));
}

function loadFootballRequest(liveid) {

    prepareSpyFoul(liveid);

    // const ws = new WebSocket('ws://localhost:9626/session');
    const ws = new WebSocket('wss://'+herokuPath+'/session');
    // const ws = new WebSocket('ws://flexyscorenode-env.eba-bkbmjuds.us-east-2.elasticbeanstalk.com/session');
    ws.onopen = function () {
        console.log('new connection: football ' + liveid);
        ws.send(JSON.stringify({
            id: liveid,
            sport: 'football'
        }));
    }

    ws.onmessage = function (msg) {
        console.log('message received');
        console.log(msg);
        let data = JSON.parse(msg.data);
        console.log(data);
        running = data['user_signal'];
        //signal 0 fermo, 1 attivo, 2 reset
        //inizia a scorrere o riprendi a scorrere
        if (flag == 0 && running == 1) {
            flag = 1;
            decrement();
        }
        //pausa
        else if (flag == 1 && running == 0) {
            flag = 0;
            reset(data['timer']);
        }
        //reset timer
        else if (running == 2) {
            reset(data['timer']);
        }
        var football_info = [data['team_1'], data['team_2'], data['points_1'], data['points_2'], data['moment'], data['overtime'],
            data['timeouts_1'], data['timeouts_2'], data['attempts'], data['yards'], data['foul_signal']
        ];
        displayFootballData(football_info);
    }
}


function prepareSpyFoul(liveid) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/dirette/out_dispatchers/outfootball.php', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        if (this.status == 200) {
            let info = JSON.parse(this.responseText);
            spyfoul = info['foul_signal'];
        }
    }
    xhr.send('liveid=' + liveid + '&source=scoreboard');
}

//timer functions

function reset(newtime) {
    time = newtime;
    var mins = Math.floor(time / 60);
    var secs = time % 60;

    if (mins < 10) mins = "0" + mins;
    if (secs < 10) secs = "0" + secs;

    timerElement.innerHTML = mins + ":" + secs;
}

function decrement() {
    if (running == 1)
        setTimeout(function () {
            time--;
            var mins = Math.floor(time / 60);
            var secs = time % 60;

            if (mins < 10) mins = "0" + mins;
            if (secs < 10) secs = "0" + secs;

            if (time < 0) {
                mins = "00";
                secs = "00";
            }

            timerElement.innerHTML = mins + ":" + secs;
            decrement();

        }, 1000)
}


//display data function

function displayFootballData(data) {
    team1Element.innerHTML = data[0];
    team2Element.innerHTML = data[1];
    points1Element.innerHTML = data[2];
    points2Element.innerHTML = data[3];
    momentElement.innerHTML = data[4];
    if (data[5] == 0) {
        overtimeElement.innerHTML = 'Q';
        ovtElement.setAttribute('class', 'box boxmoment boxovertimeoff');
    } else {
        overtimeElement.innerHTML = 'Ot';
        ovtElement.setAttribute('class', 'box boxmoment boxovertimeon');
    }
    attemptsElement.innerHTML = data[8];

    if (data[8] == 1) suffixElement.innerHTML = 'st';
    else if (data[8] == 2) suffixElement.innerHTML = 'nd';
    else if (data[8] == 3) suffixElement.innerHTML = 'rd';
    else if (data[8] > 3) suffixElement.innerHTML = 'th';

    yardsElement.innerHTML = data[9];
    let ht = data[6] < 3 ? data[6] : 3;
    let at = data[7] < 3 ? data[7] : 3;
    for (let k = 0; k < ht; k++) {
        listHomeTimeouts[k].setAttribute('class', 'box boxtimeouts boxhometimeouts boxon');
    }
    for (let k = ht; k < 3; k++) {
        listHomeTimeouts[k].setAttribute('class', 'box boxtimeouts boxhometimeouts');
    }
    for (let j = 0; j < at; j++) {
        listAwayTimeouts[j].setAttribute('class', 'box boxtimeouts boxawaytimeouts boxon');
    }
    for (let j = at; j < 3; j++) {
        listAwayTimeouts[j].setAttribute('class', 'box boxtimeouts boxawaytimeouts');
    }

    if (data[10] != spyfoul) {
        spyfoul = data[10];
        foulSignalElement.setAttribute('class', 'box boxfoul boxfoulon');
        deactivateFoul();
    }
}

function deactivateFoul() {
    setTimeout(function () {
        foulSignalElement.setAttribute('class', 'box boxfoul boxfouloff');
    }, 5000);
}