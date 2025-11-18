var perk_json;
var active_type;
let url_vars = new URL(document.location).searchParams;

// WebSocket vers Streamer.bot
let sbSocket = null;

function connectStreamerbotWS() {
    try {
        sbSocket = new WebSocket("ws://127.0.0.1:8080/");
        sbSocket.onopen = () => {
            console.log("[SB] WebSocket connecté !");
        };
        sbSocket.onerror = () => {
            console.warn("[SB] Impossible de se connecter à WebSocket.");
        };
    } catch (e) {
        console.warn("[SB] WebSocket erreur :", e);
    }
}

connectStreamerbotWS();

function customColors() {
    if (url_vars.has("bg-c")) {
        if (url_vars.get("bg-c").includes("rgb")) {
            document.querySelector("#streaming-mode-embed").style.background = `${url_vars.get("bg-c")}`;
        } else {
            document.querySelector("#streaming-mode-embed").style.background = `#${url_vars.get("bg-c")}`;
        }
    }

    if (url_vars.has("pn-c")) {
        document.querySelectorAll(".perk_name").forEach(x => {
            x.style.color = url_vars.get("pn-c").includes("rgb") 
                ? `${url_vars.get("pn-c")}` 
                : `#${url_vars.get("pn-c")}`;
        });
    }

    if (url_vars.has("ch-c")) {
        document.querySelectorAll(".perk_character").forEach(x => {
            x.style.color = url_vars.get("ch-c").includes("rgb") 
                ? `${url_vars.get("ch-c")}` 
                : `#${url_vars.get("ch-c")}`;
        });
    }
}

function loadPerks() {
    var request = new XMLHttpRequest();

    if (url_vars.get("type") == "surv") {
        request.open("GET", "../../json/survivor-perks.json", false);
        active_type = "surv";
    } else {
        request.open("GET", "../../json/killer-perks.json", false);
        active_type = "kill";
    }

    request.send(null);
    perk_json = JSON.parse(request.responseText);

    perk_json.perks.sort((a, b) => a.perk_name.localeCompare(b.perk_name));
}

// -----------------------------
// ENVOI STREAMERBOT VIA WEBSOCKET
// -----------------------------
function sendToStreamerBotWS(selected) {

    if (!sbSocket || sbSocket.readyState !== 1) {
        console.warn("[SB] WebSocket pas connecté, impossible d’envoyer l'annonce.");
        return;
    }

    let payload = {
        request: "DoAction",
        action: {
            name: "DBD Roulette - Annonce Chat"
        },
        args: {
            type: (active_type === "kill" ? "Killer" : "Survivant"),

            perk1: selected[0].perk_name,
            perk1Char: selected[0].character,

            perk2: selected[1].perk_name,
            perk2Char: selected[1].character,

            perk3: selected[2].perk_name,
            perk3Char: selected[2].character,

            perk4: selected[3].perk_name,
            perk4Char: selected[3].character
        }
    };

    sbSocket.send(JSON.stringify(payload));
    console.log("[SB] Annonce envoyée :", payload);
}

// -----------------------------
// PICK PERKS
// -----------------------------
function pickRandomPerk() {
    customColors();
    loadPerks();

    let blacklist = url_vars.has("exclude")
        ? url_vars.get("exclude").split(",").map(Number)
        : [];

    let sel = [];
    while (sel.length < 4) {
        let r = Math.floor(Math.random() * perk_json.perks.length);
        if (blacklist.includes(r)) continue;
        if (sel.includes(r)) continue;
        sel.push(r);
    }

    let selectedPerks = [];

    for (let i = 0; i < 4; i++) {
        let p = perk_json.perks[sel[i]];
        selectedPerks.push(p);

        document.getElementById("pn" + i).innerHTML = p.perk_name;
        document.getElementById("pc" + i).innerHTML = p.character;

        let icon = "../../css/img/" + active_type + "/iconperks-" +
            p.perk_name.toLowerCase()
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .replace(/[^a-z0-9]/gi, "") +
            ".png";

        document.getElementById("pi" + i).style.backgroundImage = "url(" + icon + ")";

        document.getElementById("p" + i).classList.add("transparent");
        document.getElementById("pn" + i).classList.add("transparent");
        document.getElementById("pc" + i).classList.add("transparent");
    }

    // 🔥 envoi websocket vers Streamer.bot
    sendToStreamerBotWS(selectedPerks);

    setTimeout(perk1an, 250);
}

// Animations
function perk1an() {
    document.getElementById("p0").classList.remove("transparent");
    document.getElementById("p0").classList.add("animate1");
    document.getElementById("pn0").classList.add("animate2");
    document.getElementById("pc0").classList.add("animate3");

    setTimeout(perk2an, 1000);
}

function perk2an() {
    document.getElementById("p1").classList.remove("transparent");
    document.getElementById("p1").classList.add("animate1");
    document.getElementById("pn1").classList.add("animate2");
    document.getElementById("pc1").classList.add("animate3");

    setTimeout(perk3an, 1000);
}

function perk3an() {
    document.getElementById("p2").classList.remove("transparent");
    document.getElementById("p2").classList.add("animate1");
    document.getElementById("pn2").classList.add("animate2");
    document.getElementById("pc2").classList.add("animate3");

    setTimeout(perk4an, 1000);
}

function perk4an() {
    document.getElementById("p3").classList.remove("transparent");
    document.getElementById("p3").classList.add("animate1");
    document.getElementById("pn3").classList.add("animate2");
    document.getElementById("pc3").classList.add("animate3");
}

function cleanup() {
    ["p0","p1","p2","p3"].forEach(id => document.getElementById(id).classList.remove("animate1"));
    ["pn0","pn1","pn2","pn3"].forEach(id => document.getElementById(id).classList.remove("animate2"));
    ["pc0","pc1","pc2","pc3"].forEach(id => document.getElementById(id).classList.remove("animate3"));
}
