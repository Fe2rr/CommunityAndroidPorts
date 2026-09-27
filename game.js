/*
 * GOOGLE SHEETS
 */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1CO7dH7mbj9sl67g4e94wczHESp0NAsOa7_chKKii9OA/export?format=csv";


const gameTitle =
    document.getElementById("game-title");

const gameYear =
    document.getElementById("game-year");

const portList =
    document.getElementById("port-list");

const statusElement =
    document.getElementById("status");


/*
 * Normalize headers.
 */
function normalizeHeader(value) {

    return value
        .replace(/^\uFEFF/, "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Normalize text.
 */
function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Create the same slug used by app.js.
 */
function createSlug(name) {

    return normalizeText(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/*
 * CSV parser.
 */
function parseCSV(csv) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;


    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];


        if (char === '"') {

            if (
                insideQuotes &&
                csv[i + 1] === '"'
            ) {

                field += '"';
                i++;

            } else {

                insideQuotes =
                    !insideQuotes;
            }

            continue;
        }


        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(field);
            field = "";

            continue;
        }


        if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                csv[i + 1] === "\n"
            ) {
                i++;
            }


            row.push(field);
            field = "";


            if (
                row.some(
                    value =>
                        value.trim() !== ""
                )
            ) {

                rows.push(row);
            }


            row = [];

            continue;
        }


        field += char;
    }


    if (
        field.length > 0 ||
        row.length > 0
    ) {

        row.push(field);

        if (
            row.some(
                value =>
                    value.trim() !== ""
            )
        ) {

            rows.push(row);
        }
    }


    if (rows.length === 0) {
        return [];
    }


    const headers =
        rows.shift().map(
            normalizeHeader
        );


    return rows.map(values => {

        const rowObject = {};


        headers.forEach(
            (header, index) => {

                rowObject[header] =
                    (values[index] || "").trim();

            }
        );


        return rowObject;
    });
}


/*
 * Find a column.
 */
function getColumn(row, possibleNames) {

    for (const name of possibleNames) {

        const key =
            normalizeHeader(name);


        if (
            Object.prototype.hasOwnProperty.call(
                row,
                key
            )
        ) {

            return row[key];
        }
    }


    return "";
}


/*
 * Process rows and keep the current game
 * when Google Sheets leaves GAME empty
 * because of merged cells.
 */
function processRows(rows) {

    let currentGame = "";
    let currentYear = "";

    const result = [];


    for (const row of rows) {

        const gameValue =
            getColumn(row, [
                "GAME",
                "GAME NAME",
                "NAME",
                "JUEGO"
            ]).trim();


        const yearValue =
            getColumn(row, [
                "YEAR",
                "ANO",
                "AÑO"
            ]).trim();


        if (gameValue) {
            currentGame = gameValue;
        }


        if (yearValue) {
            currentYear = yearValue;
        }


        const project =
            getColumn(row, [
                "PROJECT",
                "PROYECTO"
            ]);


        /*
         * LINK = text displayed on the button.
         */
        const link =
            getColumn(row, [
                "LINK",
                "PROJECT LINK",
                "ENLACE"
            ]);


        /*
         * URL = actual destination of the button.
         */
        const url =
            getColumn(row, [
                "URL"
            ]);


        const developer =
            getColumn(row, [
                "DEVELOPER",
                "DEVELOPER/PUBLISHER",
                "DESARROLLADOR"
            ]);


        const version =
            getColumn(row, [
                "VERSION",
                "VERSIÓN"
            ]);


        const controller =
            getColumn(row, [
                "CONTROLLER SUPPORT",
                "CONTROLLER",
                "GAMEPAD",
                "MANDO"
            ]);


        const files =
            getColumn(row, [
                "NEEDS GAME FILES?",
                "NEEDS GAME FILES",
                "GAME FILES",
                "NECESITA ARCHIVOS"
            ]);


        const works =
            getColumn(row, [
                "WORKS?",
                "WORKS",
                "FUNCIONA"
            ]);


        const lastUpdate =
            getColumn(row, [
                "LAST UPDATE",
                "LAST UPDATED",
                "ÚLTIMA ACTUALIZACIÓN"
            ]);


        const notes =
            getColumn(row, [
                "NOTES",
                "NOTE",
                "NOTAS"
            ]);


        const hasPortData =
            project ||
            link ||
            url ||
            developer ||
            version ||
            controller ||
            files ||
            works ||
            lastUpdate ||
            notes;


        /*
         * Ignore rows that do not appear
         * to correspond to a port.
         */
        if (
            !currentGame ||
            !hasPortData
        ) {

            continue;
        }


        result.push({

            game: currentGame,

            year: currentYear,

            project: project.trim(),

            link: link.trim(),

            url: url.trim(),

            developer: developer.trim(),

            version: version.trim(),

            controller: controller.trim(),

            files: files.trim(),

            works: works.trim(),

            lastUpdate: lastUpdate.trim(),

            notes: notes.trim()

        });
    }


    return result;
}


/*
 * Get the requested game from the URL.
 *
 * Example:
 *
 * game.html?game=zelda
 */
function getRequestedGame() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("game") || "";
}


/*
 * Display a value as a row.
 */
function createInfoRow(
    label,
    value
) {

    if (!value) {
        return null;
    }


    const row =
        document.createElement("div");


    row.className =
        "port-info-row";


    const labelElement =
        document.createElement("span");


    labelElement.className =
        "port-info-label";


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement("span");


    valueElement.className =
        "port-info-value";


    valueElement.textContent =
        value;


    row.appendChild(labelElement);
    row.appendChild(valueElement);


    return row;
}


/*
 * Display all ports.
 */
function displayGame(game) {

    gameTitle.textContent =
        game.name;


    if (game.year) {

        gameYear.textContent =
            game.year;

    } else {

        gameYear.textContent =
            "";
    }


    statusElement.textContent =
        `${game.ports.length} port${game.ports.length !== 1 ? "s" : ""}`;


    portList.innerHTML = "";


    for (
        let index = 0;
        index < game.ports.length;
        index++
    ) {

        const port =
            game.ports[index];


        const card =
            document.createElement("div");


        card.className =
            "port";


        /*
         * Port title.
         */
        const title =
            document.createElement("h2");


        title.className =
            "port-title";


        title.textContent =
            port.project ||
            `Port ${index + 1}`;


        card.appendChild(title);


        /*
         * Information.
         */
        const info =
            document.createElement("div");


        info.className =
            "port-info";


        const fields = [

            ["Developer", port.developer],

            ["Version", port.version],

            ["Controller Support", port.controller],

            ["Needs Original Files", port.files],

            ["Works", port.works],

            ["Last Update", port.lastUpdate]

        ];


        for (const [label, value] of fields) {

            const row =
                createInfoRow(
                    label,
                    value
                );


            if (row) {
                info.appendChild(row);
            }
        }


        card.appendChild(info);


        /*
         * Notes.
         */
        if (port.notes) {

            const notes =
                document.createElement("div");


            notes.className =
                "port-notes";


            const notesTitle =
                document.createElement("strong");


            notesTitle.textContent =
                "Notes";


            const notesText =
                document.createElement("p");


            notesText.textContent =
                port.notes;


            notes.appendChild(notesTitle);
            notes.appendChild(notesText);


            card.appendChild(notes);
        }


        /*
         * Link to the port.
         *
         * LINK = visible button text.
         * URL = actual destination.
         */
        if (port.url) {

            const link =
                document.createElement("a");


            link.className =
                "port-link";


            link.href =
                port.url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.textContent =
                port.link || "Open Port →";


            card.appendChild(link);
        }


        portList.appendChild(card);
    }
}


/*
 * Load the game.
 */
async function loadGame() {

    try {

        const requestedGame =
            getRequestedGame();


        if (!requestedGame) {

            throw new Error(
                "No game was specified."
            );
        }


        statusElement.textContent =
            "Loading ports...";


        const response =
            await fetch(SHEET_URL);


        if (!response.ok) {

            throw new Error(
                `HTTP error ${response.status}`
            );
        }


        const csv =
            await response.text();


        const rows =
            parseCSV(csv);


        const processedRows =
            processRows(rows);


        /*
         * Find the requested game.
         */
        const matchingRows =
            processedRows.filter(
                row =>
                    createSlug(row.game) ===
                    requestedGame
            );


        if (matchingRows.length === 0) {

            throw new Error(
                "This game was not found in Google Sheets."
            );
        }


        const game = {

            name: matchingRows[0].game,

            year: matchingRows[0].year,

            ports: matchingRows

        };


        document.title =
            `${game.name} - Community Android Ports`;


        displayGame(game);


    } catch (error) {

        console.error(error);


        gameTitle.textContent =
            "Error";


        gameYear.textContent =
            "";


        statusElement.textContent =
            "";


        portList.innerHTML = `
            <div class="error">

                <strong>
                    Could not load the game.
                </strong>

                <br><br>

                ${error.message}

            </div>
        `;
    }
}


/*
 * Start.
 */
loadGame();
