const RAIO_TERRA_METROS = 6371000;

function toRad(graus) {
  return (graus * Math.PI) / 180;
}

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_METROS * c;
}

function pontoMaisProximo(lat, lon, pontos) {
  if (!Array.isArray(pontos) || pontos.length === 0) return null;
  let melhor = null;
  for (const p of pontos) {
    const d = distanciaMetros(lat, lon, p.latitude, p.longitude);
    if (!melhor || d < melhor.distancia) {
      melhor = { ponto: p, distancia: d };
    }
  }
  return melhor;
}

module.exports = { distanciaMetros, pontoMaisProximo };
