let html = document.querySelector("html");
let select = document.querySelector(".theme");
const input = document.getElementById("search")
let micbutton = document.querySelector(".mic");
const display = document.querySelector(".display");

html.style.backgroundColor = "white";

select.addEventListener("click", theme);

function theme() {
    if (html.style.backgroundColor === "white") {
        html.style.backgroundColor = "#282828";
        select.src = "img/sun.png"
    } else {
        html.style.backgroundColor = "white";
        select.src = "img/moon.png"
    }
}

micbutton.addEventListener("click", micaction);
let micImg = micbutton;
micImg = "img/mic-off.png";

function micaction() {
    if (micImg === "img/mic-off.png") {
        micOn();
    } else {
        micOff();
    }
    micbutton.src = micImg;
}

let recognition;
let recognitionTimeout;

function startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        if (!recognition) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                startRecognitionTimer();
            };

            recognition.onresult = async (event) => {
                const result = event.results[event.results.length - 1];
                const transcript = result[0].transcript;
                input.value = transcript;
                await search();
                resetRecognitionTimer(); // Reset the timer on speech input
            };

            recognition.onaudioend = () => {
                // The user stopped speaking, so start the 5-second timer
                startRecognitionTimer();
            };

            recognition.onend = () => {
                clearRecognitionTimer();
            };
        }

        recognition.start();

        input.addEventListener('input', () => {
            resetRecognitionTimer(); // Reset the timer on user input
            micOff();
        });
    } else {
        alert('Web Speech API is not supported in this browser.');
    }
}

function startRecognitionTimer() {
    recognitionTimeout = setTimeout(() => {
        micOff();
    }, 5000);
}

function resetRecognitionTimer() {
    clearTimeout(recognitionTimeout);
    startRecognitionTimer();
}

function clearRecognitionTimer() {
    clearTimeout(recognitionTimeout);
}

function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        micbutton.src = "img/mic-off.png";
        input.setAttribute("placeholder", "What do you want to listen to?");
    }
}

function micOn() {
    micImg = "img/mic-on.png";
    input.setAttribute("placeholder", "Listening...");
    startSpeechRecognition();
}

function micOff() {
    micImg = "img/mic-off.png";
    input.setAttribute("placeholder", "What do you want to listen to?");
    stopSpeechRecognition();
}


const socket = io('https://spotify-anmolsonkar.koyeb.app/')

let currentSearch;
let screen = window.innerWidth;

input.addEventListener("input", () => {

    const query = input.value.trim()

    currentSearch = query;

    if (query !== "") {
        socket.emit("send", query, screen);
    }
    else {
        display.innerHTML = "";
        display.style.display = "none";
        input.style.border = "1px solid #e1e2e4";
        input.style.borderRadius = "60px";


    }
})


socket.on("receive", (results) => {

    if (currentSearch === '') {

        return;
    }

    document.addEventListener("click", (event) => {

        if (event.target === input && results) {

            display.style.display = "grid";
            input.style.borderBottomRightRadius = "0px";
            input.style.borderBottomLeftRadius = "0px";
        }

        else {
            display.style.display = "none";
            input.style.borderRadius = "30px";
        }

    });

    display.innerHTML = "";
    display.style.display = "grid";
    input.style.borderRadius = "30px";
    input.style.borderBottomRightRadius = "0px";
    input.style.borderBottomLeftRadius = "0px";

    const list = [];

    results.forEach(item => {

        const li = document.createElement('li');

        li.innerHTML = ` <p><img src="${item.image}" loading="lazy" >${item.name} by ${item.artists}</p>`;

        li.querySelector('p').addEventListener('click', () => {
            iframe.src = `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`;
            iframe.style.display = "block";
            document.querySelector(".footer").style.display = "flex";
            micOff();

            const download = document.getElementById("Download")
            download.addEventListener("click", () => {
                socket.emit("download", item)
            })

        });

        list.push(li)
    });
    display.append(...list);
});


socket.on("response", data => {
    document.getElementById("progress").textContent = data.message;
})
