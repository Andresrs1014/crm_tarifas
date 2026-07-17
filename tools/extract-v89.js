// Extracción mecánica: separa el HTML monolítico en bloques CSS/JS por posición de línea exacta.
// No modifica ni una sola línea de contenido — solo mueve texto de un archivo a otro y
// deja una referencia (<link>/<script src>) en el lugar exacto donde estaba.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'HTML ULTIMA VERSION', 'seguimiento-zymo-v6 (89).html');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
// nota: split('\n') deja un \r final en cada línea si el archivo es CRLF — lo preservamos tal cual
// (no normalizamos line endings, para no "tocar" el contenido).

function slice1(startLine, endLine) {
  // startLine/endLine son 1-indexed e INCLUSIVOS
  return lines.slice(startLine - 1, endLine).join('\n');
}

const blocks = [
  { type: 'css', file: 'css/block-1-main.css',        start: 18,    end: 904,   tagStart: 17,    tagEnd: 905   },
  { type: 'css', file: 'css/block-2-crm-board.css',    start: 1332,  end: 1332,  inline: true },
  { type: 'js',  file: 'js/block-1-init.js',           start: 1340,  end: 1357,  tagStart: 1339,  tagEnd: 1358  },
  { type: 'js',  file: 'js/block-2-app.js',            start: 2145,  end: 12956, tagStart: 2144,  tagEnd: 12957 },
  { type: 'js',  file: 'js/block-3-ficha-scroll.js',   start: 14519, end: 14529, tagStart: 14518, tagEnd: 14530 },
  { type: 'css', file: 'css/block-3-ficha.css',        start: 14542, end: 14554, tagStart: 14541, tagEnd: 14555 },
  { type: 'js',  file: 'js/block-4-tail.js',           start: 14558, end: 15649, tagStart: 14557, tagEnd: 15650 },
];

for (const b of blocks) {
  let content;
  if (b.inline) {
    // línea 1332 completa es: '  <style>#crm-board::-webkit-scrollbar{display:none}</style>'
    const line = lines[b.start - 1];
    const m = line.match(/<style>([\s\S]*?)<\/style>/);
    content = m ? m[1] : '';
  } else {
    content = slice1(b.start, b.end);
  }
  fs.writeFileSync(path.join(__dirname, b.file), content + '\n', 'utf8');
  console.log(`${b.file}: ${content.split('\n').length} líneas escritas`);
}

// Verificación de integridad: el JSON embebido (línea 2140-2142) debe seguir intacto y sin tocar.
console.log('\n--- línea 2140 (debe ser el <script type=application/json>) ---');
console.log(lines[2139]);
console.log('--- longitud línea 2141 (el JSON) ---', lines[2140].length, 'caracteres');
