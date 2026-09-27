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

let games = [];


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
 * Normalize text for comparison.
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
         * Quotes
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
         * Comma outside quotes
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
         * End of row
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


            /*
             * Avoid completely empty rows.
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
                    (values[index]
