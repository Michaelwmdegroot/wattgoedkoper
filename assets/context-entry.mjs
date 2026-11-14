/**
 * A content page can request an EXPLANATION, never an automatic change to a home.
 * Only exact, public fragment tokens are accepted. No data or identifiers in URLs.
 */
const ENTRY = Object.freeze({
  '#verken-zonnepanelen': Object.freeze({kind:'upgrade',id:'solar'}),
  '#verken-thuisbatterij': Object.freeze({kind:'upgrade',id:'battery'}),
  '#verken-slim-verbruik': Object.freeze({kind:'upgrade',id:'smart-use'}),
  '#verken-isolatie': Object.freeze({kind:'upgrade',id:'insulation'}),
  '#verken-warmtepomp': Object.freeze({kind:'upgrade',id:'heatpump'}),
  '#verken-energieplan': Object.freeze({kind:'plan'}),
});
export function resolveContextEntry(hash) {
  if (typeof hash !== 'string' || !Object.hasOwn(ENTRY,hash)) return null;
  return ENTRY[hash];
}
