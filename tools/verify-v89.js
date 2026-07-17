// Prueba de integridad: vuelve a armar el HTML original a partir de index.html + los
// bloques separados, y lo compara byte a byte contra el archivo fuente real.
const fs = require('fs');
const path = require('path');

const rebuilt = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').split('\n');

const inlineMap = [
  { marker: '<link rel="stylesheet" href="css/block-1-main.css">', file: 'css/block-1-main.css', wrap: ['<style>', '</style>'] },
  { marker: '  <link rel="stylesheet" href="css/block-2-crm-board.css">', file: 'css/block-2-crm-board.css', wrap: ['  <style>', '</style>'], singleLine: true },
  { marker: '  <script src="js/block-1-init.js"></script>', file: 'js/block-1-init.js', wrap: ['  <script>', '  </script>'] },
  { marker: '<script src="js/block-2-app.js"></script>', file: 'js/block-2-app.js', wrap: ['<script>', '</script>'] },
  { marker: '<script src="js/block-3-ficha-scroll.js"></script>', file: 'js/block-3-ficha-scroll.js', wrap: ['<script>', '</script>'] },
  { marker: '<link rel="stylesheet" href="css/block-3-ficha.css">', file: 'css/block-3-ficha.css', wrap: ['<style>', '</style>'] },
  { marker: '<script src="js/block-4-tail.js"></script>', file: 'js/block-4-tail.js', wrap: ['<script>', '</script>'] },
];

let out = [];
for (const line of rebuilt) {
  const hit = inlineMap.find(m => m.marker === line);
  if (!hit) { out.push(line); continue; }
  const content = fs.readFileSync(path.join(__dirname, hit.file), 'utf8').replace(/\n$/, '');
  if (hit.singleLine) {
    out.push(`  <style>${content}</style>`);
  } else {
    out.push(hit.wrap[0]);
    out.push(...content.split('\n'));
    out.push(hit.wrap[1]);
  }
}

const rebuiltStr = out.join('\n');
const originalStr = fs.readFileSync(path.join(__dirname, 'HTML ULTIMA VERSION', 'seguimiento-zymo-v6 (89).html'), 'utf8');

if (rebuiltStr === originalStr) {
  console.log('✅ IDÉNTICO byte a byte al original. Separación 100% sin pérdida.');
} else {
  console.log('❌ DIFERENCIA encontrada.');
  console.log('Longitud original:', originalStr.length, '| Longitud reconstruida:', rebuiltStr.length);
  const a = originalStr.split('\n'), b = rebuiltStr.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.log(`Primera diferencia en línea ${i + 1}:`);
      console.log('  original:     ', JSON.stringify((a[i]||'').slice(0, 120)));
      console.log('  reconstruido: ', JSON.stringify((b[i]||'').slice(0, 120)));
      break;
    }
  }
}
