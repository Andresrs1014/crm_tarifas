/**
 * Columnas monetarias de los schemas Transporte/Paqueteo — portado de
 * frontend/src/lib/htmlV6/constants.ts (TRANSP_SCHEMA / PAQUETEO_SCHEMA).
 * Usado por `actualizarTarifas` para saber qué claves de `item.campos` son
 * dinero (y por lo tanto deben incrementarse), a diferencia de texto/número/%.
 */

/** Columnas cuyo tipo es 'moneda' | 'tarifa' (siempre dinero) o 'mixta'/'tarifa-mixta'/'tarifa-texto' (dinero por defecto). */
const MONEDA_COLS = new Set([
  'viaje4h', 'viaje8h', 'horaAdc',                                 // transporte local
  'unaHora', 'minima',                                             // transporte otros (mixtas)
  'minFlete', 'manejo',                                            // coord_industrial / coord_xl
  'primerDoc', 'copiaAdc',                                         // coord_sobreporte / coord_firma
  'local', 'regional', 'nacional', 'zonal', 'otras', 'especial',   // coord_ecommerce / servientrega
  'minManejoSeg',                                                  // tcc_paqueteria / tcc_mensajeria
  'fisico', 'digital', 'mixto',                                    // tcc_boomerang
  'rad_fis_flete', 'rad_fis_docAdc',
  'rad_dig_flete', 'rad_dig_docAdc',
  'rad_mix_flete', 'rad_mix_docAdc',                               // tcc_radicacion
  'kg1', 'kg2', 'kg3', 'kg4', 'kg5',                                // tcc_mensajeria
  'valorFlete', 'sobrefleteMin',                                   // srv_sobreporte / srv_mercancia_premier
  'territorial', 'urbano',                                         // servientrega
]);

/** Subconjunto de tipo 'tarifa-mixta'/'tarifa-texto'/'mixta': el ítem puede marcarlas como % o texto en `tiposCampo`. */
const MIXED_COLS = new Set(['unaHora', 'minima', 'nacional', 'territorial', 'zonal', 'urbano', 'especial']);

/** true si `campos[colId]` representa un valor monetario para ESTE ítem (respeta el toggle guardado). */
export function isMonedaCampo(colId: string, tiposCampo?: Record<string, string>): boolean {
  if (!MONEDA_COLS.has(colId)) return false;
  if (MIXED_COLS.has(colId)) {
    const toggle = tiposCampo?.[colId];
    return !toggle || toggle === 'moneda';
  }
  return true;
}
