/*

GOOGLE SHEETS

This is your Google Sheets file.

There is no need to modify or remove

merged cells.
*/


const SHEET_URL =
"https://docs.google.com/spreadsheets/d/1CO7dH7mbj9sl67g4e94wczHESp0NAsOa7_chKKii9OA/export?format=csv";

const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search");
const statusElement = document.getElementById("status");

let games = [];

/*

Normalize column names.
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

Normalize text for game comparison.
*/
function normalizeText(value) {

return String(value || "")
.trim()
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}


/*

Convert the game name into an identifier

that can be used in the URL.

Example:

The Legend of Zelda: A Link to the Past

↓

the-legend-of-zelda-a-link-to-the-past
*/
function createSlug(name) {

return normalizeText(name)
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");
}


/*

Full CSV parser.

Handles:

commas inside fields


quotes


line breaks inside fields
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

     if (insideQuotes && csv[i + 1] === '"') {  

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
 if (char === "," && !insideQuotes) {  

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
      * Handle CRLF  
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

Last field.
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

First row = headers.
*/
const headers = rows.shift().map(
normalizeHeader
);


/*

Convert rows into objects.
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

Find a column.
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

Convert CSV rows.

GAME and YEAR can be merged in Google Sheets.

When a row does not have GAME,

the game from the previous row is inherited.
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
  * If we find a new game,  
  * update the current game.  
  */  
 if (gameValue) {  
     currentGame = gameValue;  
 }  


 /*  
  * Same for the year.  
  */  
 if (yearValue) {  
     currentYear = yearValue;  
 }  


 /*  
  * Port-specific data.  
  */  
 const project =  
     getColumn(row, [  
         "PROJECT",  
         "PROYECTO"  
     ]);  


 /*  
  * LINK is the text displayed on the button.  
  */  
 const link =  
     getColumn(row, [  
         "LINK",  
         "PROJECT LINK",  
         "ENLACE"  
     ]);  


 /*  
  * URL is the actual destination.  
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


 /*  
  * A row is considered a port when it has  
  * some project-specific data.  
  */  
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

Group ports by game.
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
  * If we find a year that we did not  
  * have before, save it.  
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

Display games.
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
${list.length} game${list.length !== 1 ? "s" : ""};

const fragment =
document.createDocumentFragment();

for (const game of list) {

/*  
  * Each game points to:  
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
  * Year  
  */  
 if (game.year) {  

     const span =  
         document.createElement("span");  

     span.textContent =  
         game.year;  

     info.appendChild(span);  
 }  


 /*  
  * Number of ports  
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

Search.
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

Load Google Sheets.
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


 if (!csv || !csv.trim()) {  

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


 if (processedRows.length === 0) {  

     throw new Error(  
         "No games or ports were found in the sheet."  
     );  
 }  


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


 displayGames(games);

} catch (error) {

console.error(  
     "Could not load games:",  
     error  
 );  


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

Search events.
*/
searchInput.addEventListener(
"input",
searchGames
);


/*

Start loading the games.
*/
loadGames();
asi?
