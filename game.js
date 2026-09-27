/*
 * GOOGLE SHEETS
 */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1GrLXvVH_xEsbUadDLo_dSlFkYdj6GTeXyRfdyy3-CGU/export?format=csv";


const gameTitle =
    document.getElementById("game-title");

const gameYear =
    document.getElementById("game-year");

const portList =
    document.getElementById("port-list");

const statusElement =
    document.getElementById("status");


/*
 * Normaliza encabezados.
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
 * Normaliza texto.
 */
function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Crea el mismo slug utilizado por app.js.
 */
function createSlug(name) {

    return normalizeText(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/*
 * Parser CSV.
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
 * Busca una columna.
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
 * Procesa las filas y mantiene el juego
 * cuando Google Sheets deja GAME vacío
 * por las celdas combinadas.
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


        const link =
            getColumn(row, [
                "LINK",
                "URL",
                "PROJECT LINK",
                "ENLACE"
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
            developer ||
            version ||
            controller ||
            files ||
            works ||
            lastUpdate ||
            notes;


        /*
         * Ignorar filas que no parecen
         * corresponder a un port.
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
 * Obtiene el juego solicitado desde la URL.
 *
 * Ejemplo:
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
 * Muestra un dato como una fila.
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
 * Muestra todos los ports.
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
         * Título del port.
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
         * Información.
         */
        const info =
            document.createElement("div");


        info.className =
            "port-info";


        const fields = [

            ["Desarrollador", port.developer],

            ["Versión", port.version],

            ["Soporte de mando", port.controller],

            ["Necesita archivos originales", port.files],

            ["Funciona", port.works],

            ["Última actualización", port.lastUpdate]

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
         * Notas.
         */
        if (port.notes) {

            const notes =
                document.createElement("div");


            notes.className =
                "port-notes";


            const notesTitle =
                document.createElement("strong");


            notesTitle.textContent =
                "Notas";


            const notesText =
                document.createElement("p");


            notesText.textContent =
                port.notes;


            notes.appendChild(notesTitle);
            notes.appendChild(notesText);


            card.appendChild(notes);
        }


        /*
         * Botón al proyecto.
         */
        if (port.link) {

            const link =
                document.createElement("a");


            link.className =
                "port-link";


            link.href =
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
