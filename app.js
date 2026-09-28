/*
 * GOOGLE SHEETS
 *
 * This is your Google Sheets file.
 *
 * Each row should contain its own GAME and YEAR.
 */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1CO7dH7mbj9sl67g4e94wczHESp0NAsOa7_chKKii9OA/export?format=csv";


const gameList =
    document.getElementById("game-list");

const searchInput =
    document.getElementById("search");

const statusElement =
    document.getElementById("status");


let games = [];


/*
 * Normalize column names.
 */
function normalizeHeader(value) {

    return String(value || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Normalize text for game comparison.
 */
function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Convert the game name into an identifier
 * that can be used in the URL.
 *
 * Example:
 *
 * The Legend of Zelda: A Link to the Past
 *
 * ↓
 *
 * the-legend-of-zelda-a-link-to-the-past
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
 * Convert CSV rows.
 *
 * Every row contains its own GAME and YEAR.
 */
function processRows(rows) {

    const result = [];


    for (const row of rows) {

        const game =
            getColumn(row, [
                "GAME",
                "GAME NAME",
                "NAME",
                "JUEGO"
            ]).trim();


        const year =
            getColumn(row, [
                "YEAR",
                "ANO",
                "AÑO"
            ]).trim();


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


        if (
            !game ||
            !hasPortData
        ) {
            continue;
        }


        result.push({

            game: game,
            year: year,
            project: project,
            link: link,
            url: url,
            developer: developer,
            version: version,
            controller: controller,
            files: files,
            works: works,
            lastUpdate: lastUpdate,
            notes: notes

        });
    }


    return result;
}


/*
 * Group ports by game.
 */
function groupGames(rows) {

    const grouped =
        new Map();


    for (const port of rows) {

        const key =
            normalizeText(port.game);


        if (!grouped.has(key)) {

            grouped.set(
                key,
                {
                    name: port.game,
                    year: port.year,
                    slug: createSlug(port.game),
                    ports: []
                }
            );
        }


        const game =
            grouped.get(key);


        if (
            !game.year &&
            port.year
        ) {

            game.year =
                port.year;
        }


        game.ports.push(port);
    }


    return Array.from(
        grouped.values()
    );
}


/*
 * Display games.
 */
function displayGames(list) {

    gameList.innerHTML = "";


    if (list.length === 0) {

        gameList.innerHTML = `
            <div class="no-results">
                No games found.
            </div>
        `;


        statusElement.textContent =
            "0 games";


        return;
    }


    statusElement.textContent =
        `${list.length} ${list.length === 1 ? "game" : "games"}`;


    for (const game of list) {

        const card =
            document.createElement("a");

        card.className =
            "game-card";

        card.href =
            `game.html?game=${encodeURIComponent(game.slug)}`;


        const title =
            document.createElement("h2");

        title.textContent =
            game.name;


        card.appendChild(title);


        if (game.year) {

            const year =
                document.createElement("span");

            year.className =
                "game-year";

            year.textContent =
                game.year;

            card.appendChild(year);
        }


        const portCount =
            document.createElement("span");

        portCount.className =
            "port-count";

        portCount.textContent =
            `${game.ports.length} ${
                game.ports.length === 1
                    ? "port"
                    : "ports"
            }`;


        card.appendChild(portCount);


        gameList.appendChild(card);
    }
}


/*
 * Search games.
 */
function searchGames() {

    const query =
        normalizeText(
            searchInput.value
        );


    if (!query) {

        displayGames(games);

        return;
    }


    const filtered =
        games.filter(game => {

            const gameName =
                normalizeText(game.name);


            return gameName.includes(query);
        });


    displayGames(filtered);
}


/*
 * Load games from Google Sheets.
 */
async function loadGames() {

    statusElement.textContent =
        "Loading games...";


    try {

        const response =
            await fetch(SHEET_URL);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const csv =
            await response.text();


        const rows =
            parseCSV(csv);


        const processed =
            processRows(rows);


        games =
            groupGames(processed);


        /*
         * Sort alphabetically.
         */
        games.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );


        displayGames(games);

    } catch (error) {

        console.error(
            "Error loading games:",
            error
        );


        gameList.innerHTML = `
            <div class="no-results">
                Unable to load games.
            </div>
        `;


        statusElement.textContent =
            "Error loading games";
    }
}


/*
 * Search whenever the user types.
 */
if (searchInput) {

    searchInput.addEventListener(
        "input",
        searchGames
    );
}


/*
 * Load the games when the page opens.
 */
loadGames();
