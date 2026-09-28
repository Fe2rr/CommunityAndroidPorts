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


const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search");
const statusElement = document.getElementById("status");

const menuButton =
    document.getElementById("menu-button");

const menuClose =
    document.getElementById("menu-close");

const sideMenu =
    document.getElementById("side-menu");

const menuOverlay =
    document.getElementById("menu-overlay");

const platformList =
    document.getElementById("platform-list");


let games = [];

let selectedPlatform = "";

let selectedCategory = "";


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
 */
function createSlug(name) {

    return normalizeText(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/*
 * Full CSV parser.
 */
function parseCSV(csv) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];

        if (char === '"') {

            if (insideQuotes && csv[i + 1] === '"') {

                field += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;
            }

            continue;
        }


        if (char === "," && !insideQuotes) {

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


    const headers = rows.shift().map(
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


        /*
         * Platform.
         */
        const platform =
            getColumn(row, [
                "PLATFORM",
                "PLATAFORM",
                "PLATAFORMA"
            ]).trim();


        /*
         * Port-specific data.
         */
        const project =
            getColumn(row, [
                "PROJECT",
                "PROYECTO"
            ]);


        const link =
            getColumn(row, [
                "LINK",
                "PROJECT LINK",
                "ENLACE"
            ]);


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


        if (
            !currentGame ||
            !hasPortData
        ) {
            continue;
        }


        result.push({

            game: currentGame,

            year: currentYear,

            platform: platform,

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
 * Group ports by game.
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
                    ports: [],
                    platforms: new Set()
                }
            );
        }


        const game =
            grouped.get(key);


        if (
            !game.year &&
            port.year
        ) {
            game.year = port.year;
        }


        if (port.platform) {

            game.platforms.add(
                port.platform
            );
        }


        game.ports.push(port);
    }


    return Array.from(
        grouped.values()
    ).map(game => {

        game.platforms =
            Array.from(
                game.platforms
            );

        return game;
    });
}


/*
 * Check if a game has a Dual Screen project.
 */
function isDualScreen(game) {

    return game.ports.some(
        port =>
            normalizeText(port.project)
                .includes("dual screen")
    );
}


/*
 * Get all platforms used by the games.
 */
function getPlatforms() {

    const platforms = new Map();


    for (const game of games) {

        for (const platform of game.platforms) {

            const key =
                normalizeText(platform);


            if (!platforms.has(key)) {

                platforms.set(
                    key,
                    platform
                );
            }
        }
    }


    return Array.from(
        platforms.values()
    ).sort(
        (a, b) =>
            a.localeCompare(
                b,
                "en",
                {
                    sensitivity: "base"
                }
            )
    );
}


/*
 * Open menu.
 */
function openMenu() {

    sideMenu.classList.add("open");

    menuOverlay.classList.add("open");
}


/*
 * Close menu.
 */
function closeMenu() {

    sideMenu.classList.remove("open");

    menuOverlay.classList.remove("open");
}


/*
 * Create platform menu.
 */
function displayPlatformMenu() {

    platformList.innerHTML = "";


    /*
     * All Platforms.
     */
    const allButton =
        document.createElement("button");


    allButton.type =
        "button";


    allButton.className =
        "platform-button";


    allButton.textContent =
        "All Platforms";


    allButton.addEventListener(
        "click",
        () => {

            selectedPlatform = "";
            selectedCategory = "";

            displayFilteredGames();

            closeMenu();
        }
    );


    platformList.appendChild(
        allButton
    );


    /*
     * Dual Screen category.
     */
    const dualScreenButton =
        document.createElement("button");


    dualScreenButton.type =
        "button";


    dualScreenButton.className =
        "platform-button";


    dualScreenButton.textContent =
        "Dual Screen";


    dualScreenButton.addEventListener(
        "click",
        () => {

            selectedPlatform = "";
            selectedCategory = "dual-screen";

            displayFilteredGames();

            closeMenu();
        }
    );


    platformList.appendChild(
        dualScreenButton
    );


    /*
     * Platforms from Google Sheets.
     */
    const platforms =
        getPlatforms();


    for (const platform of platforms) {

        const button =
            document.createElement("button");


        button.type =
            "button";


        button.className =
            "platform-button";


        button.textContent =
            platform;


        button.addEventListener(
            "click",
            () => {

                selectedPlatform =
                    platform;

                selectedCategory = "";

                displayFilteredGames();

                closeMenu();
            }
        );


        platformList.appendChild(
            button
        );
    }
}


    /*
     * Dual Screen category.
     */
    const dualScreenButton =
        document.createElement("button");


    dualScreenButton.type =
        "button";


    dualScreenButton.className =
        "platform-button";


    dualScreenButton.textContent =
        "Dual Screen";


    dualScreenButton.addEventListener(
        "click",
        () => {

            selectedPlatform = "";
            selectedCategory = "dual-screen";

            displayFilteredGames();

            closeMenu();
        }
    );


    platformList.appendChild(
        dualScreenButton
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
        `${list.length} game${list.length !== 1 ? "s" : ""}`;


    const fragment =
        document.createDocumentFragment();


    for (const game of list) {

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


        if (game.year) {

            const span =
                document.createElement("span");

            span.textContent =
                game.year;

            info.appendChild(span);
        }


        const portCount =
            document.createElement("span");


        portCount.textContent =
            `${game.ports.length} port${game.ports.length !== 1 ? "s" : ""}`;


        info.appendChild(
            portCount
        );


        element.appendChild(
            name
        );

        element.appendChild(
            info
        );


        fragment.appendChild(
            element
        );
    }


    gameList.appendChild(
        fragment
    );
}


/*
 * Filter games by search and platform.
 */
function displayFilteredGames() {

    const query =
        normalizeText(
            searchInput.value
        );


    const filtered =
        games.filter(game => {

            /*
             * Dual Screen category.
             */
            if (
                selectedCategory === "dual-screen" &&
                !isDualScreen(game)
            ) {

                return false;
            }


            /*
             * Platform filter.
             */
            if (
                selectedPlatform &&
                !game.platforms.some(
                    platform =>
                        normalizeText(platform) ===
                        normalizeText(selectedPlatform)
                )
            ) {

                return false;
            }


            /*
             * Search filter.
             */
            if (!query) {
                return true;
            }


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


    displayGames(
        filtered
    );
}


/*
 * Search.
 */
function searchGames() {

    displayFilteredGames();
}


/*
 * Load Google Sheets.
 */
async function loadGames() {

    try {

        statusElement.textContent =
            "Loading games...";


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


        if (rows.length === 0) {

            throw new Error(
                "The sheet contains no data."
            );
        }


        const processedRows =
            processRows(rows);


        games =
            groupGames(processedRows);


        /*
         * Alphabetical order.
         */
        games.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "en",
                    {
                        sensitivity: "base"
                    }
                )
        );


        /*
         * Create Categories menu.
         */
        displayPlatformMenu();


        displayGames(
            games
        );


    } catch (error) {

        console.error(error);


        statusElement.textContent =
            "";


        gameList.innerHTML = `
            <div class="error">

                <strong>
                    Could not load the games.
                </strong>

                <br><br>

                ${error.message}

            </div>
        `;
    }
}


/*
 * Search while typing.
 */
searchInput.addEventListener(
    "input",
    searchGames
);


/*
 * Menu events.
 */
menuButton.addEventListener(
    "click",
    openMenu
);


menuClose.addEventListener(
    "click",
    closeMenu
);


menuOverlay.addEventListener(
    "click",
    closeMenu
);


/*
 * Start.
 */
loadGames();
