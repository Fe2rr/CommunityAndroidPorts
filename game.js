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
 * Process        link.href =
                port.link;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.textContent =
                "Ver port →";


            card.appendChild(link);
        }


        portList.appendChild(card);
    }
}


/*
 * Carga el juego.
 */
async function loadGame() {

    try {

        const requestedGame =
            getRequestedGame();


        if (!requestedGame) {

            throw new Error(
                "No se especificó ningún juego."
            );
        }


        statusElement.textContent =
            "Cargando ports...";


        const response =
            await fetch(SHEET_URL);


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }


        const csv =
            await response.text();


        const rows =
            parseCSV(csv);


        const processedRows =
            processRows(rows);


        /*
         * Buscar el juego solicitado.
         */
        const matchingRows =
            processedRows.filter(
                row =>
                    createSlug(row.game) ===
                    requestedGame
            );


        if (matchingRows.length === 0) {

            throw new Error(
                "No se encontró este juego en Google Sheets."
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
                    No se pudo cargar el juego.
                </strong>

                <br><br>

                ${error.message}

            </div>
        `;
    }
}


/*
 * Iniciar.
 */
loadGame();
