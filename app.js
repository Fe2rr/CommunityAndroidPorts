const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1CO7dH7mbj9sl67g4e94wczHESp0NAsOa7_chKKii9OA/export?format=csv";

const gameList =
    document.getElementById("game-list");

const statusElement =
    document.getElementById("status");


async function loadGames() {

    statusElement.textContent =
        "Connecting to Google Sheets...";

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

        console.log("CSV received:");
        console.log(csv);

        statusElement.textContent =
            "Google Sheets connected!";

        gameList.innerHTML = `
            <pre>${escapeHTML(csv)}</pre>
        `;

    } catch (error) {

        console.error(error);

        statusElement.textContent =
            "Error loading Google Sheets.";

        gameList.innerHTML = `
            <p>
                ${escapeHTML(error.message)}
            </p>
        `;
    }
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
