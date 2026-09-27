/*
 * URL DE TU GOOGLE SHEET
 *
 * Primero publica tu Google Sheet en formato CSV.
 *
 * Ejemplo:
 * https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=ID_DE_LA_HOJA
 *
 * Reemplaza la URL de abajo por la tuya.
 */

const SHEET_URL =
    "PEGAR_AQUI_LA_URL_CSV_DE_TU_GOOGLE_SHEET";


const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search");
const statusElement = document.getElementById("status");

let games = [];


/*
 * Convierte una línea CSV en columnas.
 *
 * Esto permite manejar correctamente campos
 * que contienen comas entre comillas.
 */
function parseCSVLine(line) {

    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {

        const char = line[i];

        if (char === '"') {

            if (insideQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }

        } else if (char === "," && !insideQuotes) {

            result.push(current);
            current = "";

        } else {

            current += char;
        }
    }

    result.push(current);

    return result;
}


/*
 * Convierte el CSV completo en objetos.
 */
function parseCSV(csv) {

    const lines = csv
        .replace(/\r/g, "")
        .split("\n")
        .filter(line => line.trim() !== "");

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCSVLine(lines[0]).map(header =>
        header
            .trim()
            .replace(/^"|"$/g, "")
            .toUpperCase()
    );

    const result = [];

    for (let i = 1; i < lines.length; i++) {

        const values = parseCSVLine(lines[i]);

        const row = {};

        headers.forEach((header, index) => {
            row[header] = (values[index] || "")
                .trim()
                .replace(/^"|"$/g, "");
        });

        result.push(row);
    }

    return result;
}


/*
 * Busca una columna independientemente de
 * cómo esté escrita.
 */
function getColumn(row, possibleNames) {

    for (const name of possibleNames) {

        const key = Object.keys(row).find(
            key => key.toUpperCase() === name.toUpperCase()
        );

        if (key) {
            return row[key];
        }
    }

    return "";
}


/*
 * Convierte una fila de Google Sheets
 * en un juego.
 */
function convertRow(row) {

    return {

        name: getColumn(row, [
            "GAME",
            "GAME NAME",
            "NAME",
            "JUEGO"
        ]),

        year: getColumn(row, [
            "YEAR",
            "AÑO"
        ]),

        project: getColumn(row, [
            "PROJECT",
            "PROYECTO"
        ]),

        link: getColumn(row, [
            "LINK",
            "URL",
            "PROJECT LINK",
            "ENLACE"
        ]),

        developer: getColumn(row, [
            "DEVELOPER",
            "DEVELOPER/PUBLISHER",
            "DESARROLLADOR"
        ]),

        controller: getColumn(row, [
            "CONTROLLER SUPPORT",
            "CONTROLLER",
            "GAMEPAD",
            "MANDO"
        ]),

        files: getColumn(row, [
            "NEEDS GAME FILES?",
            "NEEDS GAME FILES",
            "GAME FILES",
            "NECESITA ARCHIVOS"
        ]),

        works: getColumn(row, [
            "WORKS?",
            "WORKS",
            "FUNCIONA"
        ]),

        version: getColumn(row, [
            "VERSION",
            "VERSIÓN"
        ]),

        lastUpdate: getColumn(row, [
            "LAST UPDATE",
            "LAST UPDATED",
            "ÚLTIMA ACTUALIZACIÓN"
        ]),

        notes: getColumn(row, [
            "NOTES",
            "NOTE",
            "NOTAS"
        ])

    };
}


/*
 * Muestra los juegos en pantalla.
 */
function displayGames(list) {

    gameList.innerHTML = "";

    if (list.length === 0) {

        gameList.innerHTML = `
            <div class="no-results">
                No se encontraron juegos.
            </div>
        `;

        statusElement.textContent = "0 juegos";

        return;
    }


    statusElement.textContent =
        `${list.length} juego${list.length !== 1 ? "s" : ""}`;


    const fragment = document.createDocumentFragment();


    list.forEach(game => {

        const element = document.createElement("a");

        element.className = "game";


        /*
         * Si existe un enlace al proyecto,
         * la tarjeta se convierte en un enlace.
         */
        if (game.link) {

            element.href = game.link;
            element.target = "_blank";
            element.rel = "noopener noreferrer";

        } else {

            element.href = "javascript:void(0)";

        }


        const name = document.createElement("h2");

        name.className = "game-name";

        name.textContent =
            game.name || "Juego sin nombre";


        const info = document.createElement("div");

        info.className = "game-info";


        if (game.year) {

            const span = document.createElement("span");

            span.textContent = game.year;

            info.appendChild(span);
        }


        if (game.project) {

            const span = document.createElement("span");

            span.className = "game-project";

            span.textContent = game.project;

            info.appendChild(span);
        }


        if (game.developer) {

            const span = document.createElement("span");

            span.textContent = game.developer;

            info.appendChild(span);
        }


        if (game.version) {

            const span = document.createElement("span");

            span.textContent = `v${game.version}`;

            info.appendChild(span);
        }


        element.appendChild(name);
        element.appendChild(info);

        fragment.appendChild(element);

    });


    gameList.appendChild(fragment);
}


/*
 * Busca juegos.
 */
function searchGames() {

    const query =
        searchInput.value
            .toLowerCase()
            .trim();


    if (!query) {

        displayGames(games);

        return;
    }


    const filtered = games.filter(game => {

        const searchableText = [

            game.name,
            game.year,
            game.project,
            game.developer,
            game.controller,
            game.files,
            game.works,
            game.version,
            game.notes

        ]
            .join(" ")
            .toLowerCase();


        return searchableText.includes(query);

    });


    displayGames(filtered);
}


/*
 * Carga los datos desde Google Sheets.
 */
async function loadGames() {

    try {

        if (
            !SHEET_URL ||
            SHEET_URL ===
            "PEGAR_AQUI_LA_URL_CSV_DE_TU_GOOGLE_SHEET"
        ) {

            throw new Error(
                "Todavía no configuraste la URL de Google Sheets."
            );
        }


        statusElement.textContent =
            "Cargando juegos...";


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


        games =
            rows
                .map(convertRow)
                .filter(game => game.name);


        /*
         * Orden alfabético.
         */
        games.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "es",
                {
                    sensitivity: "base"
                }
            )
        );


        displayGames(games);


    } catch (error) {

        console.error(error);


        statusElement.textContent = "";


        gameList.innerHTML = `
            <div class="error">
                <strong>No se pudieron cargar los juegos.</strong>
                <br><br>
                ${error.message}
            </div>
        `;
    }
}


/*
 * Buscar mientras escribimos.
 */
searchInput.addEventListener(
    "input",
    searchGames
);


/*
 * Iniciar.
 */
loadGames();
