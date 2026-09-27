/*
 * GOOGLE SHEETS
 *
 * This is your Google Sheets file.
 *
 * There is no need to modify or remove
 * merged cells.
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
 * Normalize column names.
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
 * Create a URL-safe game identifier.
 */
function createSlug(name) {

    return normalizeText(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/*
 * Full CSV parser.
 *
 * Handles:
 *
 * - commas inside fields
 * - quotes
 * - line breaks inside fields
 */
function parseCSV(csv) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;


    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];


        /*
         * Quotes.
         */
        if (char === '"') {

            if (
                insideQuotes &&
                csv[i + 1] === '"'
            ) {

                field += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;
            }

            continue;
        }


        /*
         * Comma outside quotes.
         */
        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(field);
            field = "";

            continue;
        }


        /*
         * End of row.
         */
        if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            /*
             * Handle CRLF.
             */
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
                    value => value.trim() !== ""
                )
            ) {

                rows.push(row);
            }


            row = [];

            continue;
        }


        field += char;
    }


    /*
     * Last field.
     */
    if (
        field.length > 0 ||
        row.length > 0
    ) {

        row.push(field);


        if (
            row.some(
                value => value.trim() !== ""
            )
        ) {

            rows.push(row);
        }
    }


    if (rows.length === 0) {
        return [];
    }


    /*
     * First row = headers.
     */
    const headers =
        rows.shift().map(
            normalizeHeader
        );


    /*
     * Convert rows into objects.
     */
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

        const normalizedName =
            normalizeHeader(name);


        if (
            Object.prototype.hasOwnProperty.call(
                row,
                normalizedName
            )
        ) {

            return row[normalizedName];
        }
    }


    return "";
}


/*
 * Process CSV rows.
 *
 * Supports merged cells in Google Sheets.
 *
 * If a game has empty port columns because
 * they are part of a merged cell, the previous
 * port information is reused.
 */
function processRows(rows) {

    let currentGame = "";
    let currentYear = "";

    let lastPortData = null;

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


        /*
         * Update current game.
         */
        if (gameValue) {
            currentGame = gameValue;
        }


        /*
         * Update current year.
         */
        if (yearValue) {
            currentYear = yearValue;
        }


        /*
         * Read port data.
         */
        const project =
            getColumn(row, [
                "PROJECT",
                "PROYECTO"
            ]).trim();


        const link =
            getColumn(row, [
                "LINK",
                "PROJECT LINK",
                "ENLACE"
            ]).trim();


        const url =
            getColumn(row, [
                "URL"
            ]).trim();


        const developer =
            getColumn(row, [
                "DEVELOPER",
                "DEVELOPER/PUBLISHER",
                "DESARROLLADOR"
            ]).trim();


        const version =
            getColumn(row, [
                "VERSION",
                "VERSIÓN"
            ]).trim();


        const controller =
            getColumn(row, [
                "CONTROLLER SUPPORT",
                "CONTROLLER",
                "GAMEPAD",
                "MANDO"
            ]).trim();


        const files =
            getColumn(row, [
                "NEEDS GAME FILES?",
                "NEEDS GAME FILES",
                "GAME FILES",
                "NECESITA ARCHIVOS"
            ]).trim();


        const works =
            getColumn(row, [
                "WORKS?",
                "WORKS",
                "FUNCIONA"
            ]).trim();


        const lastUpdate =
            getColumn(row, [
                "LAST UPDATE",
                "LAST UPDATED",
                "ÚLTIMA ACTUALIZACIÓN"
            ]).trim();


        const notes =
            getColumn(row, [
                "NOTES",
                "NOTE",
                "NOTAS"
            ]).trim();


        /*
         * Check whether the row contains
         * actual port data.
         */
        const hasPortData =
            Boolean(
                project ||
                link ||
                url ||
                developer ||
                version ||
                controller ||
                files ||
                works ||
                lastUpdate ||
                notes
            );


        /*
         * Save the current port data.
         */
        if (hasPortData) {

            lastPortData = {

                project,
                link,
                url,
                developer,
                version,
                controller,
                files,
                works,
                lastUpdate,
                notes

            };
        }


        /*
         * Determine which port data to use.
         */
        let portData = null;


        if (hasPortData) {

            portData = {

                project,
                link,
                url,
                developer,
                version,
                controller,
                files,
                works,
                lastUpdate,
                notes

            };

        } else if (lastPortData) {

            /*
             * Merged-cell data.
             */
            portData = {

                ...lastPortData

            };
        }


        /*
         * Ignore rows without a game.
         */
        if (!currentGame) {
            continue;
        }


        /*
         * Ignore rows without port information.
         */
        if (!portData) {
            continue;
        }


        result.push({

            game: currentGame,

            year: currentYear,

            project: portData.project,

            link: portData.link,

            url: portData.url,

            developer: portData.developer,

            version: portData.version,

            controller: portData.controller,

            files: portData.files,

            works: portData.works,

            lastUpdate: portData.lastUpdate,

            notes: portData.notes

        });
    }


    return result;
}


/*
 * Get the requested game from the URL.
 */
function getRequestedGame() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return normalizeText(
        params.get("game")
    );
}


/*
 * Create an information row.
 */
function createInfoRow(label, value) {

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
 * Display the game.
 */
function displayGame(game) {

    gameTitle.textContent =
        game.name;


    gameYear.textContent =
        game.year || "";


    portList.innerHTML = "";


    statusElement.textContent =
        `${game.ports.length} port${game.ports.length !== 1 ? "s" : ""}`;


    const fragment =
        document.createDocumentFragment();


    for (const port of game.ports) {

        const portElement =
            document.createElement("div");


        portElement.className =
            "port";


        /*
         * Project title.
         */
        if (port.project) {

            const projectTitle =
                document.createElement("h2");


            projectTitle.className =
                "port-title";


            projectTitle.textContent =
                port.project;


            portElement.appendChild(
                projectTitle
            );
        }


        /*
         * Information container.
         */
        const info =
            document.createElement("div");


        info.className =
            "port-info";


        const developerRow =
            createInfoRow(
                "Developer",
                port.developer
            );


        if (developerRow) {
            info.appendChild(developerRow);
        }


        const versionRow =
            createInfoRow(
                "Version",
                port.version
            );


        if (versionRow) {
            info.appendChild(versionRow);
        }


        const controllerRow =
            createInfoRow(
                "Controller",
                port.controller
            );


        if (controllerRow) {
            info.appendChild(controllerRow);
        }


        const filesRow =
            createInfoRow(
                "Needs game files",
                port.files
            );


        if (filesRow) {
            info.appendChild(filesRow);
        }


        const worksRow =
            createInfoRow(
                "Works",
                port.works
            );


        if (worksRow) {
            info.appendChild(worksRow);
        }


        const updateRow =
            createInfoRow(
                "Last update",
                port.lastUpdate
            );


        if (updateRow) {
            info.appendChild(updateRow);
        }


        portElement.appendChild(info);


        /*
         * Notes.
         */
        if (port.notes) {

            const notes =
                document.createElement("div");


            notes.className =
                "port-notes";


            notes.textContent =
                port.notes;


            portElement.appendChild(
                notes
            );
        }


        /*
         * Port link.
         *
         * LINK = visible text
         * URL  = actual destination
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


            portElement.appendChild(
                link
            );

        } else if (port.link) {

            /*
             * If URL is empty but LINK exists,
             * display the text without creating
             * a broken link.
             */
            const link =
                document.createElement("div");


            link.className =
                "port-link";


            link.textContent =
                port.link;


            portElement.appendChild(
                link
            );
        }


        fragment.appendChild(
            portElement
        );
    }


    portList.appendChild(
        fragment
    );
}


/*
 * Load game data.
 */
async function loadGame() {

    try {

        statusElement.textContent =
            "Loading ports...";


        const requestedGame =
            getRequestedGame();


        if (!requestedGame) {

            throw new Error(
                "No game was specified."
            );
        }


        const response =
            await fetch(SHEET_URL);


        if (!response.ok) {

            throw new Error(
                `HTTP error ${response.status}`
            );
        }


        const csv =
            await response.text();


        if (
            !csv ||
            !csv.trim()
        ) {

            throw new Error(
                "Google Sheets returned an empty response."
            );
        }


        const rows =
            parseCSV(csv);


        if (rows.length === 0) {

            throw new Error(
                "The sheet contains no data."
            );
        }


        const processedRows =
            processRows(rows);


        /*
         * Find all rows belonging to the requested game.
         */
        const matchingRows =
            processedRows.filter(
                row =>
                    createSlug(row.game) ===
                    createSlug(requestedGame)
            );


        if (matchingRows.length === 0) {

            throw new Error(
                `Game not found: ${requestedGame}`
            );
        }


        /*
         * Build the game object.
         */
        const game = {

            name: matchingRows[0].game,

            year: matchingRows.find(
                row => row.year
            )?.year || "",

            ports: matchingRows

        };


        displayGame(game);


    } catch (error) {

        console.error(
            "Could not load game:",
            error
        );


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
 * Start loading the game.
 */
loadGame();
