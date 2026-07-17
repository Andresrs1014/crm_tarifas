// Reconstruye el HTML: reemplaza cada bloque <style>/<script> inline por una referencia
// externa (<link>/<script src>) en la MISMA posición. Todo lo demás queda byte-idéntico.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'HTML ULTIMA VERSION', 'seguimiento-zymo-v6 (89).html');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');

// Cada bloque: [tagStart, tagEnd] 1-indexed inclusivo, se reemplaza completo por `replacement`.
// Ordenados de mayor a menor línea para poder hacer splice sin invalidar los índices de los anteriores.
const replacements = [
  { tagStart: 14557, tagEnd: 15650, replacement: '<script src="js/block-4-tail.js"></script>' },
  { tagStart: 14541, tagEnd: 14555, replacement: '<link rel="stylesheet" href="css/block-3-ficha.css">' },
  { tagStart: 14518, tagEnd: 14530, replacement: '<script src="js/block-3-ficha-scroll.js"></script>' },
  { tagStart: 2144,  tagEnd: 12957, replacement: '<script src="js/block-2-app.js"></script>' },
  { tagStart: 1339,  tagEnd: 1358,  replacement: '  <script src="js/block-1-init.js"></script>' },
  { tagStart: 1332,  tagEnd: 1332,  replacement: '  <link rel="stylesheet" href="css/block-2-crm-board.css">' },
  { tagStart: 17,    tagEnd: 905,   replacement: '<link rel="stylesheet" href="css/block-1-main.css">' },
];

let out = lines.slice(); // copia
for (const r of replacements) {
  // splice: índice 0-based = tagStart-1, cantidad a borrar = tagEnd-tagStart+1
  out.splice(r.tagStart - 1, r.tagEnd - r.tagStart + 1, r.replacement);
}

fs.writeFileSync(path.join(__dirname, 'index.html'), out.join('\n'), 'utf8');
console.log('index.html escrito:', out.length, 'líneas (original tenía', lines.length, ')');
