import express from 'express'
import fetch from 'node-fetch'
import { DateTime } from 'luxon'
import * as Astronomy from 'astronomy-engine'
import tzlookup from 'tz-lookup'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(express.json())

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(__dirname))

const zodiac = [
  'Áries',
  'Touro',
  'Gêmeos',
  'Câncer',
  'Leão',
  'Virgem',
  'Libra',
  'Escorpião',
  'Sagitário',
  'Capricórnio',
  'Aquário',
  'Peixes',
]

const planetMap = [
  { label: 'Sol', body: 'Sun' },
  { label: 'Lua', body: 'Moon' },
  { label: 'Mercúrio', body: 'Mercury' },
  { label: 'Vênus', body: 'Venus' },
  { label: 'Marte', body: 'Mars' },
  { label: 'Júpiter', body: 'Jupiter' },
  { label: 'Saturno', body: 'Saturn' },
  { label: 'Urano', body: 'Uranus' },
  { label: 'Netuno', body: 'Neptune' },
  { label: 'Plutão', body: 'Pluto' },
]

const aspectAngles = [
  { name: 'Conjunção', angle: 0 },
  { name: 'Sextil', angle: 60 },
  { name: 'Quadratura', angle: 90 },
  { name: 'Trígono', angle: 120 },
  { name: 'Oposição', angle: 180 },
]

async function geocode(place) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', place)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  const res = await fetch(url, {
    headers: { 'User-Agent': 'oraculo-celeste/1.1 (demo)' },
  })
  if (!res.ok) throw new Error('Falha ao geocodificar local.')
  const [result] = await res.json()
  if (!result) throw new Error('Local não encontrado.')
  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    display: result.display_name,
  }
}

function buildTime(date, time, zone) {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone })
  if (!dt.isValid) throw new Error('Data ou hora inválida.')
  return { dt, astroTime: new Astronomy.Time(dt.toJSDate()) }
}

function normalizeDegrees(value) {
  const deg = value % 360
  return deg < 0 ? deg + 360 : deg
}

function computeAscendant(astroTime, lon) {
  const siderealHours = Astronomy.SiderealTime(astroTime) + lon / 15
  return normalizeDegrees(siderealHours * 15)
}

function computeHouses(ascendant) {
  const houses = []
  for (let i = 0; i < 12; i += 1) {
    const cusp = normalizeDegrees(ascendant + i * 30)
    houses.push({ house: i + 1, cusp, sign: zodiac[Math.floor(cusp / 30)] })
  }
  return houses
}

function computePositions(astroTime, observer, ascendant) {
  return planetMap.map((p) => {
    const equ = Astronomy.Equator(p.body, astroTime, observer, true, true)
    const ecl = Astronomy.Ecliptic(equ)
    const longitude = normalizeDegrees(ecl.elon)
    const latitude = ecl.elat
    const signIndex = Math.floor(longitude / 30)
    const house = ((Math.floor(normalizeDegrees(longitude - ascendant) / 30)) % 12) + 1
    return {
      planet: p.label,
      degree: longitude,
      latitude,
      sign: zodiac[signIndex],
      house,
    }
  })
}

function computeAspects(positions) {
  const matches = []
  positions.forEach((p1, i) => {
    for (let j = i + 1; j < positions.length; j += 1) {
      const p2 = positions[j]
      const diff = Math.abs(p1.degree - p2.degree)
      const normalized = Math.min(diff, 360 - diff)
      const aspect = aspectAngles.find((a) => Math.abs(normalized - a.angle) <= 6)
      if (aspect) {
        matches.push({
          between: `${p1.planet} & ${p2.planet}`,
          aspect: aspect.name,
          degree: normalized,
        })
      }
    }
  })
  return matches
}

function buildSolarReturn(meta, include) {
  if (!include) return null
  const birth = DateTime.fromISO(`${meta.birthDate}T${meta.birthTime}`, { zone: meta.timezone })
  const now = DateTime.now().setZone(meta.timezone)
  const targetYear = now.year >= birth.year ? now.year : birth.year
  const solarDate = birth.set({ year: targetYear })
  const astroTime = new Astronomy.Time(solarDate.toJSDate())
  const asc = computeAscendant(astroTime, meta.coordinates.lon)
  const observer = new Astronomy.Observer(meta.coordinates.lat, meta.coordinates.lon, 0)
  const positions = computePositions(astroTime, observer, asc)
  const sun = positions.find((p) => p.planet === 'Sol')
  return {
    year: targetYear,
    theme: sun?.sign,
    positions,
  }
}

function buildTransits(meta, include) {
  if (!include) return []
  const targetDate = meta.transitDate || DateTime.now().toISODate()
  const target = DateTime.fromISO(`${targetDate}T${meta.birthTime}`, { zone: meta.timezone })
  const astroTime = new Astronomy.Time(target.toJSDate())
  const asc = computeAscendant(astroTime, meta.coordinates.lon)
  const observer = new Astronomy.Observer(meta.coordinates.lat, meta.coordinates.lon, 0)
  const positions = computePositions(astroTime, observer, asc)
  return positions.map((p) => ({ ...p, window: target.toISODate() }))
}

app.post('/api/chart', async (req, res) => {
  try {
    const { fullName, birthDate, birthTime, birthPlace, language, includeSolarReturn, includeTransits, transitDate } = req.body
    if (!fullName || !birthDate || !birthTime || !birthPlace || !language) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' })
    }

    const location = await geocode(birthPlace)
    const timezone = tzlookup(location.lat, location.lon)
    const { astroTime } = buildTime(birthDate, birthTime, timezone)
    const ascendant = computeAscendant(astroTime, location.lon)
    const observer = new Astronomy.Observer(location.lat, location.lon, 0)

    const positions = computePositions(astroTime, observer, ascendant)
    const aspects = computeAspects(positions)
    const houses = computeHouses(ascendant)
    const solarReturn = buildSolarReturn(
      {
        birthDate,
        birthTime,
        timezone,
        coordinates: { lat: location.lat, lon: location.lon },
      },
      includeSolarReturn
    )
    const transits = buildTransits(
      {
        birthTime,
        timezone,
        transitDate,
        coordinates: { lat: location.lat, lon: location.lon },
      },
      includeTransits
    )

    const payload = {
      meta: {
        fullName,
        birthDate,
        birthTime,
        birthPlace: location.display,
        language,
        timezone,
        transitDate: transitDate || DateTime.now().toISODate(),
        generatedAt: DateTime.now().toISO(),
        author: language === 'en' ? `${fullName} — Astrologer` : `${fullName} — Astróloga`,
      },
      positions,
      aspects,
      houses,
      solarReturn,
      transits,
    }

    res.json(payload)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Servidor iniciado em http://localhost:${port}`))
