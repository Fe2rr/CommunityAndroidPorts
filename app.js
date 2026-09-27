/*
 * GOOGLE SHEETS
 *
 * Esta es tu hoja de Google Sheets.
 *
 * No hace falta modificarla ni quitar las
 * celdas combinadas.
 */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1GrLXvVH_xEsbUadDLo_dSlFkYdj6GTeXyRfdyy3-CGU/export?format=csv";


const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search");
const statusElement = document.getElementById("status");

let games = [];


/*
 * Normaliza nombres de columnas.
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
 * Normaliza texto para comparar juegos.
 */
function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


/*
 * Convierte el nombre del juego en un identificador
 * que podemos utilizar en la URL.
 *
 * Ejemplo:
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
 * Parser CSV completo.
 *
 * A diferencia del parser anterior, este puede
 * manejar correctamente:
 *
 * - comas dentro de campos
 * - comillas
 * - saltos de línea dentro de campos
 */
function parseCSV(csv) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];

        /*
         * Comillas
         */
        if (char === '"') {

            if (insideQuotes && csv[i + 1] === '"') {

                field += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;
            }

            continue;
        }


        /*
         * Coma fuera de comillas
         */
        if (char === "," && !insideQuotes) {

            row.push(field);
            field = "";

            continue;
        }


        /*
         * Fin de fila
         */
        if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            /*
             * Manejar CRLF
             */
            if (
                char === "\r" &&
                csv[i + 1] === "\n"
            ) {
                i++;
            }

            row.push(field);
            field = "";

            /*
             * Evitar filas completamente vacías.
             */
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
     * Último campo.
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
     * Primera fila = encabezados.
     */
    const headers = rows.shift().map(
        normalizeHeader
    );


    /*
     * Convertir las filas en objetos.
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
 * Busca una columna.
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
 * Convierte las filas del CSV.
 *
 * IMPORTANTE:
 *
 * GAME y YEAR pueden estar combinados
 * en Google Sheets.
 *
 * Cuando una fila no tiene GAME,
 * heredamos el juego de la fila anterior.
 *
 * NO hacemos esto con NEEDS GAME FILES?,
 * PROJECT, DEVELOPER, etc.
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


        /*
         * Si encontramos un nuevo juego,
         * actualizamos el juego actual.
         */
        if (gameValue) {
            currentGame = gameValue;
        }


        /*
         * Lo mismo con el año.
         */
        if (yearValue) {
            currentYear = yearValue;
        }


        /*
         * Datos específicos del port.
         */
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


        /*
         * Una fila se considera port cuando tiene
         * algún dato propio del proyecto.
         *
         * Esto evita que categorías o filas vacías
         * aparezcan como juegos.
         */
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
 * Agrupa los ports por juego.
 */
function groupGames(rows) {

    const grouped = new Map();


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


        /*
         * Si encontramos un año que antes
         * no teníamos, lo guardamos.
         */
        if (
            !game.year &&
            port.year
        ) {
            game.year = port.year;
        }


        game.ports.push(port);
    }


    return Array.from(
        grouped.values()
    );
}


/*
 * Muestra los juegos.
 */
function displayGames(list) {

    gameList.innerHTML = "";


    if (list.length === 0) {

        gameList.innerHTML = `
            <div class="no-results">
                No se encontraron juegos.
            </div>
        `;

        statusElement.textContent =
            "0 juegos";

        return;
    }


    statusElement.textContent =
        `${list.length} juego${list.length !== 1 ? "s" : ""}`;


    const fragment =
        document.createDocumentFragment();


    for (const game of list) {

        /*
         * Cada juego apunta a:
         *
         * game.html?game=slug
         */
        const element =
            document.createElement("a");


        element.className =
            "game";


        element.href =
            `game.html?game=${encodeURIComponent(game.slug)}`;


        const name =
            document.createElement("h2");


        name.className =
            "game-name";


        name.textContent =
            game.name;


        const info =
            document.createElement("div");


        info.className =
            "game-info";


        /*
         * Año
         */
        if (game.year) {

            const span =
                document.createElement("span");

            span.textContent =
                game.year;

            info.appendChild(span);
        }


        /*
         * Cantidad de ports
         */
        const portCount =
            document.createElement("span");


        portCount.textContent =
            `${game.ports.length} port${game.ports.length !== 1 ? "s" : ""}`;


        info.appendChild(portCount);


        element.appendChild(name);
        element.appendChild(info);


        fragment.appendChild(element);
    }


    gameList.appendChild(fragment);
}


/*
 * Búsqueda.
 */
function searchGames() {

    const query =
        normalizeText(searchInput.value);


    if (!query) {

        displayGames(games);

        return;
    }


    const filtered =
        games.filter(game => {

            const searchableText = [

                game.name,
                game.year,

                ...game.ports.map(port => [
                    port.project,
                    port.developer,
                    port.version,
                    port.notes
                ].join(" "))

            ]
                .join(" ")
                .toLowerCase();


            return normalizeText(
                searchableText
            ).includes(query);
        });


    displayGames(filtered);
}


/*
 * Carga Google Sheets.
 */
async function loadGames() {

    try {

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


        if (rows.length === 0) {

            throw new Error(
                "La hoja no contiene datos."
            );
        }


        const processedRows =
            processRows(rows);


        games =
            groupGames(processedRows);


        /*
         * Orden alfabético.
         */
        games.sort(
            (a, b) =>
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


        statusElement.textContent =
            "";


        gameList.innerHTML = `
            <div class="error">

                <strong>
                    No se pudieron cargar los juegos.
                </strong>

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
