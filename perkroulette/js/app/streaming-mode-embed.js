var perk_json;
var active_type;
let url_vars = new URL(document.location).searchParams;

// ======================
//  WebSocket Streamer.bot
// ======================

let sbSocket = null;
let sbReconnectTimeout = null;

function connectStreamerbot() {
    try {
        // Adresse du serveur WebSocket de Streamer.bot
        sbSocket = new WebSocket("ws://127.0.0.1:8080/");

        sbSocket.onopen = function () {
            console.log("[DBD Roulette] Connecté à Streamer.bot WebSocket");
        };

        sbSocket.onclose = function () {
            console.log("[DBD Roulette] WebSocket fermé, tentative de reconnexion dans 5s...");
            sbSocket = null;
            if (sbReconnectTimeout === null) {
                sbReconnectTimeout = setTimeout(function () {
                    sbReconnectTimeout = null;
                    connectStreamerbot();
                }, 5000);
            }
        };

        sbSocket.onerror = function (err) {
            console.log("[DBD Roulette] Erreur WebSocket :", err);
        };

        sbSocket.onmessage = function (msg) {
            // Pas besoin de traiter les réponses pour notre cas,
            // mais on laisse le handler au cas où.
            // console.log("[DBD Roulette] Message de Streamer.bot :", msg.data);
        };
    } catch (e) {
        console.log("[DBD Roulette] Exception WebSocket :", e);
    }
}

// on lance la connexion dès le chargement du script
connectStreamerbot();

function sendRouletteToStreamerbot(sel_perks) {
    if (!sbSocket || sbSocket.readyState !== WebSocket.OPEN) {
        console.log("[DBD Roulette] WebSocket non connecté, impossible d'envoyer l'annonce.");
        return;
    }

    // On récupère les 4 perks sélectionnés
    const p1 = perk_json.perks[sel_perks[0]];
    const p2 = perk_json.perks[sel_perks[1]];
    const p3 = perk_json.perks[sel_perks[2]];
    const p4 = perk_json.perks[sel_perks[3]];

    const typeLabel = (active_type === "kill") ? "Killer" : "Survivor";

    const payload = {
        request: "DoAction",
        id: "dbd-roulette",
        action: {
            // doit correspondre EXACTEMENT au nom de l'action dans Streamer.bot
            name: "DBD Roulette - Annonce Chat"
        },
        args: {
            type: typeLabel,
            perk1: p1.perk_name,
            perk1Char: p1.character,
            perk2: p2.perk_name,
            perk2Char: p2.character,
            perk3: p3.perk_name,
            perk3Char: p3.character,
            perk4: p4.perk_name,
            perk4Char: p4.character
        }
    };

    try {
        sbSocket.send(JSON.stringify(payload));
        console.log("[DBD Roulette] Annonce envoyée à Streamer.bot :", payload);
    } catch (e) {
        console.log("[DBD Roulette] Erreur à l'envoi de l'annonce :", e);
    }
}

// ======================
//  Personnalisation couleurs
// ======================

function customColors() {
    if (url_vars.has("bg-c")) {
        if (url_vars.get("bg-c").includes("rgb")) {
            document.querySelector("#streaming-mode-embed").style.background = `${url_vars.get("bg-c")}`;
        } else {
            document.querySelector("#streaming-mode-embed").style.background = `#${url_vars.get("bg-c")}`;
        }
    }
    if (url_vars.has("pn-c")) {
        var x, i;
        x = document.querySelectorAll(".perk_name");
        for (i = 0; i < x.length; i++) {
            if (url_vars.get("pn-c").includes("rgb")) {
                x[i].style.color = `${url_vars.get("pn-c")}`;
            } else {
                x[i].style.color = `#${url_vars.get("pn-c")}`;
            }
        }
    }
    if (url_vars.has("ch-c")) {
        var x, i;
        x = document.querySelectorAll(".perk_character");
        for (i = 0; i < x.length; i++) {
            if (url_vars.get("ch-c").includes("rgb")) {
                x[i].style.color = `${url_vars.get("ch-c")}`;
            } else {
                x[i].style.color = `#${url_vars.get("ch-c")}`;
            }
        }
    }
}

// ======================
//  Chargement des perks
// ======================

function loadPerks() {
    if (url_vars.get("type") == "surv") {
        var request = new XMLHttpRequest();
        request.open("GET", "/perkroulette/json/survivor-perks.json", false);
        request.send(null);
        perk_json = JSON.parse(request.responseText);
        active_type = "surv";

    } else if (url_vars.get("type") == "kill") {
        var request = new XMLHttpRequest();
        request.open("GET", "/perkroulette/json/killer-perks.json", false);
        request.send(null);
        perk_json = JSON.parse(request.responseText);
        active_type = "kill";
    }

    //  --- Tri alpha des perks ---
    perk_json.perks.sort(function (a, b) {
        return a.perk_name.localeCompare(b.perk_name);
    });
}

// ======================
//  Roulette
// ======================

function pickRandomPerk() {
    customColors();
    loadPerks();

    if (url_vars.has("exclude")) {
        var perk_blacklist = url_vars.get("exclude").split(",").map(Number);
    } else {
        perk_blacklist = [];
    }

    if (perk_blacklist.length > (perk_json.perks.length - 4)) {

        // TODO: Error: Not enough perks selected

    } else {
        var sel_perks = [];
        while (sel_perks.length < 4) {
            var randomnumber = Math.floor(Math.random() * (perk_json.perks.length));
            if (perk_blacklist.indexOf(randomnumber) > -1) continue;
            if (sel_perks.indexOf(randomnumber) > -1) continue;
            sel_perks[sel_perks.length] = randomnumber;
        }

        var i = 0;
        while (i < 4) {
            var id = 'p' + i.toString();
            if (url_vars.has("bg-url")) {
                document.getElementById(id).style.backgroundImage = `url("${url_vars.get("bg-url")}")`;
            } else {
                document.getElementById(id).style.backgroundImage = `url("/perkroulette/css/img/perk_purple.png")`;
            }
            i++;
        }

        for (var j = 0; j < 4; j++) {
            document.getElementById("pn" + j).innerHTML = perk_json.perks[sel_perks[j]].perk_name;
            document.getElementById("pc" + j).innerHTML = perk_json.perks[sel_perks[j]].character;
            document.getElementById("pi" + j).style.backgroundImage =
                "url(/perkroulette/css/img/" + active_type + "/iconperks-" +
                perk_json.perks[sel_perks[j]].perk_name.toString()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/ /gi, '')
                    .replace(/'/gi, '')
                    .replace(/-/gi, '')
                    .replace(/&/gi, 'and')
                    .replace(/!/gi, '')
                    .replace(/:/gi, '')
                    .replace(/\p{Diacritic}/gu, '') +
                ".png)";

            document.getElementById("pn" + j).classList.add('transparent');
            document.getElementById("pc" + j).classList.add('transparent');
            document.getElementById("p" + j).classList.add('transparent');
        }

        // >>> ICI : on envoie les résultats à Streamer.bot
        sendRouletteToStreamerbot(sel_perks);

        window.setTimeout(perk1an, 250);
    }
}

// ======================
//  Animations
// ======================

function perk1an() {
    document.getElementById("p0").classList.remove('transparent');

    document.getElementById("p0").classList.add('animate1');
    document.getElementById("pn0").classList.add('animate2');
    document.getElementById("pc0").classList.add('animate3');

    window.setTimeout(perk2an, 1000);
}

function perk2an() {
    document.getElementById("p1").classList.remove('transparent');

    document.getElementById("p1").classList.add('animate1');
    document.getElementById("pn1").classList.add('animate2');
    document.getElementById("pc1").classList.add('animate3');

    window.setTimeout(perk3an, 1000);
}

function perk3an() {
    document.getElementById("p2").classList.remove('transparent');

    document.getElementById("p2").classList.add('animate1');
    document.getElementById("pn2").classList.add('animate2');
    document.getElementById("pc2").classList.add('animate3');

    window.setTimeout(perk4an, 1000);
}

function perk4an() {
    document.getElementById("p3").classList.remove('transparent');

    document.getElementById("p3").classList.add('animate1');
    document.getElementById("pn3").classList.add('animate2');
    document.getElementById("pc3").classList.add('animate3');
}

function cleanup() {
    document.getElementById("p0").classList.remove('animate1');
    document.getElementById("p1").classList.remove('animate1');
    document.getElementById("p2").classList.remove('animate1');
    document.getElementById("p3").classList.remove('animate1');

    document.getElementById("pn0").classList.remove('animate2');
    document.getElementById("pn1").classList.remove('animate2');
    document.getElementById("pn2").classList.remove('animate2');
    document.getElementById("pn3").classList.remove('animate2');

    document.getElementById("pc0").classList.remove('animate3');
    document.getElementById("pc1").classList.remove('animate3');
    document.getElementById("pc2").classList.remove('animate3');
    document.getElementById("pc3").classList.remove('animate3');
}
