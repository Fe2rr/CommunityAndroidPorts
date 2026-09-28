/*

GOOGLE SHEETS

Each row should contain its own GAME and YEAR.
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

Normalize headers.
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

Normalize text.
*/
function normalizeText(value) {

return String(value || "")
.trim()
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}


/*

Create the same slug used by app.js.
*/
function createSlug(name) {

return normalizeText(name)
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");
}


/*

CSV parser.

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

for (
let i = 0;
i < csv.length;
i++
) {

const char =  
     csv[i];  


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

         insideQuotes =  
             !insideQuotes;  
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


     /*  
      * Avoid completely empty rows.  
      */  
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
value =>
value.trim() !== ""
)
) {

rows.push(row);

}
}


if (
rows.length === 0
) {

return [];

}

/*

First row = headers.
*/
const headers =
rows.shift().map(
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
function getColumn(
row,
possibleNames
) {

for (
const name of possibleNames
) {

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

Process rows.

Every row contains its own GAME and YEAR.
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


 /*  
  * A row is considered a port when it has  
  * a game and some port-specific data.  
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

Get the requested game from the URL.

Example:

game.html?game=zelda
*/
function getRequestedGame() {

const params =
new URLSearchParams(
window.location.search
);

return params.get("game") || "";
}


/*

Display a value as a row.
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

row.appendChild(
labelElement
);

row.appendChild(
valueElement
);

return row;
}


/*

Display all ports.
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
${game.ports.length} port${game.ports.length !== 1 ? "s" : ""};

portList.innerHTML =
"";

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
  * Port title.  
  */  
 const title =  
     document.createElement("h2");  


 title.className =  
     "port-title";  


 title.textContent =  
     port.project ||  
     `Port ${index + 1}`;  


 card.appendChild(  
     title  
 );  


 /*  
  * Information.  
  */  
 const info =  
     document.createElement("div");  


 info.className =  
     "port-info";  


 const fields = [  

     [  
         "Developer",  
         port.developer  
     ],  

     [  
         "Version",  
         port.version  
     ],  

     [  
         "Controller Support",  
         port.controller  
     ],  

     [  
         "Needs Original Files",  
         port.files  
     ],  

     [  
         "Works",  
         port.works  
     ],  

     [  
         "Last Update",  
         port.lastUpdate  
     ]  

 ];  


 for (  
     const [label, value]  
     of fields  
 ) {  

     const row =  
         createInfoRow(  
             label,  
             value  
         );  


     if (row) {  

         info.appendChild(  
             row  
         );  
     }  
 }  


 card.appendChild(  
     info  
 );  


 /*  
  * Notes.  
  */  
 if (port.notes) {  

     const notes =  
         document.createElement("div");  


     notes.className =  
         "port-notes";  


     const notesTitle =  
         document.createElement("strong");  


     notesTitle.textContent =  
         "Notes";  


     const notesText =  
         document.createElement("p");  


     notesText.textContent =  
         port.notes;  


     notes.appendChild(  
         notesTitle  
     );  


     notes.appendChild(  
         notesText  
     );  


     card.appendChild(  
         notes  
     );  
 }  


 /*  
  * Link to the port.  
  *  
  * LINK = visible button text.  
  * URL = actual destination.  
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
         port.link ||  
         "Open Port →";  


     card.appendChild(  
         link  
     );  
 }  


 portList.appendChild(  
     card  
 );

}
}


/*

Load the game.
*/
async function loadGame() {

try {

const requestedGame =  
     getRequestedGame();  


 if (!requestedGame) {  

     throw new Error(  
         "No game was specified."  
     );  
 }  


 statusElement.textContent =  
     "Loading ports...";  


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


 if (  
     rows.length === 0  
 ) {  

     throw new Error(  
         "The sheet contains no data."  
     );  
 }  


 const processedRows =  
     processRows(rows);  


 /*  
  * Find the requested game.  
  */  
 const matchingRows =  
     processedRows.filter(  
         row =>  
             createSlug(row.game) ===  
             requestedGame  
     );  


 if (  
     matchingRows.length === 0  
 ) {  

     throw new Error(  
         "This game was not found in Google Sheets."  
     );  
 }  


 const game = {  

     name:  
         matchingRows[0].game,  

     year:  
         matchingRows[0].year,  

     ports:  
         matchingRows  

 };  


 document.title =  
     `${game.name} - Community Android Ports`;  


 displayGame(  
     game  
 );

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

Start.
*/
loadGame();
