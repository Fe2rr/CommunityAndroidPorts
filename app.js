const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1CO7dH7mbj9sl67g4e94wczHESp0NAsOa7_chKKii9OA/export?format=csv";

const gameList =
    document.getElementById("game-list");

const statusElement =
    document.getElementById("status");


async function loadGames() {

    statusElement.textContent =
        "Reading Google Sheets...";

    try {

        const response =
            await fetch(SHEET_URL);

        if (!response.ok) {

            throw new Error(
                "HTTP error: " + response.status
            );
        }

        const csv =
            await response.text();

        const rows =
            parseCSV(csv);

        console.log("CSV rows:", rows);

        if (rows.length === 0) {

            throw new Error(
                "The CSV is empty."
            );
        }

        const headers =
            rows[0].map(normalizeHeader);

        console.log("Headers:", headers);

        const gameColumn =
            findGameColumn(headers);

        if (gameColumn === -1) {

            throw new Error(
                "Game column not found."
            );
        }

        const games = [];

        for (let i = 1; i < rows.length; i++) {

            const row = rows[i];

            const game =
                row[gameColumn]?.trim();

            if (game) {

                games.push(game);
            }
        }

        const uniqueGames =
            [...new Set(games)];

        displayGames(uniqueGames);

        statusElement.textContent =
            `${uniqueGames.length} games loaded.`;

    } catch (error) {

        console.error(error);

        statusElement.textContent =
            "Error loading games.";

        gameList.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;
    }
}


function normalizeHeader(value) {

    return String(value)
        .replace(/^\uFEFF/, "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function findGameColumn(headers) {

    const possibleNames = [
        "GAME",
        "GAME NAME",
        "NAME",
        "JUEGO"
    ];

    for (const name of possibleNames) {

        const index =
            headers.indexOf(name);

        if (index !== -1) {

            return index;
        }
    }

    return -1;
}


function parseCSV(csv) {

    const rows = [];
    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];
        const next = csv[i + 1];

        if (char === '"' && insideQuotes && next === '"') {

            field += '"';
            i++;
            continue;
        }

        if (char === '"') {

            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === "," && !insideQuotes) {

            row.push(field);
            field = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !insideQuotes) {

            if (char === "\r" && next === "\n") {

                i++;
            }

            row.push(field);
            field = "";

            if (row.some(value => value.trim() !== "")) {

                rows.push(row);
            }

            row = [];

            continue;
        }

        field += char;
    }

    if (field !== "" || row.length > 0) {

        row.push(field);

        if (row.some(value => value.trim() !== "")) {

            rows.push(row);
        }
    }

    return rows;
}


function displayGames(games) {

    gameList.innerHTML = "";

    games.forEach(game => {

        const element =
            document.createElement("div");

        element.className =
            "game-card";

        element.textContent =
            game;

        gameList.appendChild(element);
    });
}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


loadGames();
