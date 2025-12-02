const zodiacSigns = [
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

const translations = {
  'pt-BR': {
    chartTitle: 'Mapa natal e revolução solar',
    narrative: 'Interpretação personalizada',
    solarReturn: 'Revolução solar',
    transits: 'Trânsitos',
    guidance: 'Orientação geral',
    house: (house) => `Casa ${house}`,
    authoredBy: (name) => `${name} — Astróloga`,
  },
  en: {
    chartTitle: 'Natal chart & solar return',
    narrative: 'Personalized interpretation',
    solarReturn: 'Solar return',
    transits: 'Transits',
    guidance: 'General guidance',
    house: (house) => `House ${house}`,
    authoredBy: (name) => `${name} — Astrologer`,
  },
}

const interpretationTemplates = {
  'pt-BR': {
    houseMeaning: (planet, house, sign) =>
      `${planet} na casa ${house} em ${sign} reforça um foco consciente neste território da vida, pedindo presença e curiosidade.`,
    aspectMeaning: (p1, p2, aspect) =>
      `${aspect} entre ${p1} e ${p2} sugere um diálogo ativo entre os temas desses corpos, abrindo espaço para ação deliberada.`,
    transitMeaning: (planet, sign) =>
      `${planet} transitando ${sign} colore o clima do momento com esse tom zodiacal, trazendo oportunidades para se alinhar ao fluxo.`,
    guidance: (tone) =>
      `Síntese geral: ${tone}. Aja com intenção, registre seus movimentos e mantenha práticas de autocuidado.`,
  },
  en: {
    houseMeaning: (planet, house, sign) =>
      `${planet} in house ${house} through ${sign} spotlights this life domain, inviting mindfulness and curiosity.`,
    aspectMeaning: (p1, p2, aspect) =>
      `${aspect} between ${p1} and ${p2} ignites a dialogue between their themes, opening space for deliberate action.`,
    transitMeaning: (planet, sign) =>
      `${planet} moving through ${sign} paints the season with that tone, offering chances to align with the flow.`,
    guidance: (tone) =>
      `Overall synthesis: ${tone}. Move intentionally, journal your process, and sustain your care rituals.`,
  },
}

function toggleMode() {
  const html = document.documentElement
  html.classList.toggle('light')
}

function hashSeed(value) {
  let hash = 0
  const str = value.toString()
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildInterpretation(data, lang) {
  const template = interpretationTemplates[lang]
  const { positions, aspects: aspectList, solarReturn, transits } = data
  const entries = []

  positions.slice(0, 4).forEach((pos) => {
    entries.push({
      title: `${pos.planet} · ${translations[lang].house(pos.house)}`,
      body: template.houseMeaning(pos.planet, pos.house, pos.sign),
    })
  })

  aspectList.slice(0, 3).forEach((aspect) => {
    const [p1, p2] = aspect.between.split(' & ')
    entries.push({
      title: `${aspect.aspect} (${aspect.degree.toFixed(1)}°)`,
      body: template.aspectMeaning(p1, p2, aspect.aspect),
    })
  })

  if (solarReturn) {
    entries.push({
      title: `${translations[lang].solarReturn} ${solarReturn.year}`,
      body: template.houseMeaning('Sol', 'SR', solarReturn.theme),
    })
  }

  if (transits.length) {
    transits.slice(0, 2).forEach((transit) => {
      entries.push({
        title: `${translations[lang].transits} · ${transit.window}`,
        body: template.transitMeaning(transit.planet, transit.sign),
      })
    })
  }

  const tones = [
    'ano de expansão introspectiva',
    'fase de comunicações e estudo',
    'temporada de coragem prática',
    'ciclo de cura e refinamento',
  ]
  const tone = tones[hashSeed(JSON.stringify(data)) % tones.length]
  entries.push({ title: translations[lang].guidance, body: template.guidance(tone) })

  return entries
}

function renderInterpretation(entries, lang) {
  const container = document.getElementById('interpretation')
  container.innerHTML = ''
  if (!entries.length) {
    container.innerHTML = '<p class="muted">Gere o mapa para ver a narrativa.</p>'
    return
  }
  entries.forEach((entry) => {
    const card = document.createElement('article')
    card.className = 'card'
    const title = document.createElement('h3')
    title.textContent = entry.title
    const body = document.createElement('p')
    body.textContent = entry.body
    card.appendChild(title)
    card.appendChild(body)
    container.appendChild(card)
  })
}

function formatDegree(value) {
  return `${value.toFixed(1)}°`
}

function renderChart(data) {
  const container = document.getElementById('chart')
  const size = 400
  const radius = size / 2 - 16
  const center = size / 2
  const ring = 36

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', size)
  svg.setAttribute('height', size)
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)

  const defs = document.createElementNS(svgNS, 'defs')
  const gradient = document.createElementNS(svgNS, 'linearGradient')
  gradient.setAttribute('id', 'chartGradient')
  gradient.innerHTML = `
    <stop offset="0%" stop-color="#c4a2ff" />
    <stop offset="100%" stop-color="#7be7ff" />
  `
  defs.appendChild(gradient)
  svg.appendChild(defs)

  const zodiacRing = document.createElementNS(svgNS, 'circle')
  zodiacRing.setAttribute('cx', center)
  zodiacRing.setAttribute('cy', center)
  zodiacRing.setAttribute('r', radius)
  zodiacRing.setAttribute('fill', 'none')
  zodiacRing.setAttribute('stroke', 'url(#chartGradient)')
  zodiacRing.setAttribute('stroke-width', '10')
  svg.appendChild(zodiacRing)

  for (let i = 0; i < 12; i += 1) {
    const angle = ((i * 30 - 90) * Math.PI) / 180
    const x = center + Math.cos(angle) * (radius - 18)
    const y = center + Math.sin(angle) * (radius - 18)
    const label = document.createElementNS(svgNS, 'text')
    label.setAttribute('x', x)
    label.setAttribute('y', y)
    label.setAttribute('fill', 'currentColor')
    label.setAttribute('font-size', '11')
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('dominant-baseline', 'middle')
    label.textContent = zodiacSigns[i].slice(0, 3)
    svg.appendChild(label)
  }

  data.houses.forEach((house) => {
    const angle = ((house.cusp - 90) * Math.PI) / 180
    const x1 = center + Math.cos(angle) * (radius - ring)
    const y1 = center + Math.sin(angle) * (radius - ring)
    const x2 = center + Math.cos(angle) * radius
    const y2 = center + Math.sin(angle) * radius
    const line = document.createElementNS(svgNS, 'line')
    line.setAttribute('x1', x1)
    line.setAttribute('y1', y1)
    line.setAttribute('x2', x2)
    line.setAttribute('y2', y2)
    line.setAttribute('stroke', 'currentColor')
    line.setAttribute('stroke-width', '1')
    line.setAttribute('opacity', '0.35')
    svg.appendChild(line)
  })

  data.positions.forEach((pos, idx) => {
    const angle = ((pos.degree - 90) * Math.PI) / 180
    const x = center + Math.cos(angle) * (radius - ring - idx * 6)
    const y = center + Math.sin(angle) * (radius - ring - idx * 6)

    const planetCircle = document.createElementNS(svgNS, 'circle')
    planetCircle.setAttribute('cx', x)
    planetCircle.setAttribute('cy', y)
    planetCircle.setAttribute('r', 9)
    planetCircle.setAttribute('fill', 'var(--panel)')
    planetCircle.setAttribute('stroke', 'currentColor')
    svg.appendChild(planetCircle)

    const text = document.createElementNS(svgNS, 'text')
    text.setAttribute('x', x)
    text.setAttribute('y', y + 3)
    text.setAttribute('fill', 'currentColor')
    text.setAttribute('font-size', '9')
    text.setAttribute('text-anchor', 'middle')
    text.textContent = pos.planet[0]
    svg.appendChild(text)
  })

  if (data.solarReturn?.positions) {
    data.solarReturn.positions.forEach((pos, idx) => {
      const angle = ((pos.degree - 90) * Math.PI) / 180
      const x = center + Math.cos(angle) * (radius - ring - 70 - idx * 4)
      const y = center + Math.sin(angle) * (radius - ring - 70 - idx * 4)
      const diamond = document.createElementNS(svgNS, 'rect')
      diamond.setAttribute('x', x - 6)
      diamond.setAttribute('y', y - 6)
      diamond.setAttribute('width', 12)
      diamond.setAttribute('height', 12)
      diamond.setAttribute('fill', 'none')
      diamond.setAttribute('stroke', 'url(#chartGradient)')
      diamond.setAttribute('transform', `rotate(45 ${x} ${y})`)
      svg.appendChild(diamond)
    })
  }

  container.innerHTML = ''
  container.appendChild(svg)
}

async function requestChart(form) {
  const payload = {
    fullName: form.fullName.value,
    birthDate: form.birthDate.value,
    birthTime: form.birthTime.value,
    birthPlace: form.birthPlace.value,
    language: form.language.value,
    includeSolarReturn: form.includeSolarReturn.checked,
    includeTransits: form.includeTransits.checked,
    transitDate: form.transitDate.value || undefined,
  }

  const response = await fetch('/api/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json.error || 'Erro ao calcular mapa.')
  }
  return json
}

function renderDataOutput(data) {
  const output = document.getElementById('data-output')
  output.textContent = JSON.stringify(data, null, 2)
}

function serializeChart() {
  const svg = document.querySelector('#chart svg')
  if (!svg) return null
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svg)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`
}

async function downloadChart() {
  const dataUrl = serializeChart()
  if (!dataUrl) return
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'mapa-astral.svg'
  link.click()
}

function renderPositions(positions) {
  const container = document.getElementById('positions-table')
  container.innerHTML = ''
  const header = document.createElement('div')
  header.className = 'table__row header'
  ;['Planeta', 'Signo', 'Casa', 'Longitude'].forEach((label) => {
    const cell = document.createElement('div')
    cell.textContent = label
    header.appendChild(cell)
  })
  container.appendChild(header)

  positions.forEach((pos) => {
    const row = document.createElement('div')
    row.className = 'table__row'
    const cells = [pos.planet, pos.sign, pos.house, formatDegree(pos.degree)]
    cells.forEach((value) => {
      const cell = document.createElement('div')
      cell.textContent = value
      row.appendChild(cell)
    })
    container.appendChild(row)
  })
}

function renderHouses(houses) {
  const container = document.getElementById('houses-grid')
  container.innerHTML = ''
  houses.forEach((house) => {
    const card = document.createElement('div')
    card.className = 'house'
    const title = document.createElement('strong')
    title.textContent = `Casa ${house.house}`
    const cusp = document.createElement('p')
    cusp.className = 'small'
    cusp.textContent = `${house.sign} — ${formatDegree(house.cusp)}`
    card.appendChild(title)
    card.appendChild(cusp)
    container.appendChild(card)
  })
}

function renderAspects(aspects) {
  const container = document.getElementById('aspects-list')
  container.innerHTML = ''
  if (!aspects.length) {
    container.innerHTML = '<p class="muted">Sem aspectos principais encontrados.</p>'
    return
  }
  aspects.forEach((aspect) => {
    const item = document.createElement('div')
    item.className = 'list__item'
    const title = document.createElement('strong')
    title.textContent = `${aspect.between}`
    const body = document.createElement('p')
    body.className = 'small'
    body.textContent = `${aspect.aspect} • ${formatDegree(aspect.degree)}`
    item.appendChild(title)
    item.appendChild(body)
    container.appendChild(item)
  })
}

function renderTiming(data) {
  const container = document.getElementById('timing')
  container.innerHTML = ''

  if (data.solarReturn) {
    const solar = document.createElement('div')
    solar.className = 'list__item'
    const title = document.createElement('strong')
    title.textContent = `Revolução solar ${data.solarReturn.year}`
    const body = document.createElement('p')
    body.className = 'small'
    body.textContent = `Sol em ${data.solarReturn.theme}`
    solar.appendChild(title)
    solar.appendChild(body)
    container.appendChild(solar)
  }

  if (data.transits?.length) {
    data.transits.slice(0, 4).forEach((transit) => {
      const item = document.createElement('div')
      item.className = 'list__item'
      const title = document.createElement('strong')
      title.textContent = `${transit.planet} → ${transit.sign}`
      const body = document.createElement('p')
      body.className = 'small'
      body.textContent = `Janela: ${transit.window} | Casa ${transit.house}`
      item.appendChild(title)
      item.appendChild(body)
      container.appendChild(item)
    })
  }
}

async function downloadPDF(data, entries) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const maxWidth = 515
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Mapa astral — Oráculo Celeste', margin, y)
  y += 18
  doc.setFontSize(12)
  doc.text(data.meta.author, margin, y)
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.text(`Nascimento: ${data.meta.birthDate} ${data.meta.birthTime}`, margin, y)
  y += 16
  doc.text(`Local: ${data.meta.birthPlace}`, margin, y)
  y += 16
  doc.text(`Fuso: ${data.meta.timezone}`, margin, y)
  y += 16
  doc.text(`Trânsitos: ${data.meta.transitDate}`, margin, y)
  y += 24

  const img = new Image()
  const svgUrl = serializeChart()
  if (svgUrl) {
    await new Promise((resolve) => {
      img.onload = resolve
      img.src = svgUrl
    })
    doc.addImage(img, 'PNG', margin, y, 240, 240)
  }

  y += 260
  entries.forEach((entry) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(entry.title, margin, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    const split = doc.splitTextToSize(entry.body, maxWidth)
    doc.text(split, margin, y)
    y += split.length * 14 + 8
    if (y > 760) {
      doc.addPage()
      y = margin
    }
  })

  doc.save('relatorio-astrologico.pdf')
}

function renderMeta(data) {
  document.getElementById('meta-location').textContent = data.meta.birthPlace
  document.getElementById('meta-time').textContent = `${data.meta.birthDate} ${data.meta.birthTime}`
  document.getElementById('meta-zone').textContent = data.meta.timezone
}

function renderSummary(data) {
  document.getElementById('sun-sign').textContent = data.summary?.sun || '—'
  document.getElementById('moon-sign').textContent = data.summary?.moon || '—'
  document.getElementById('asc-sign').textContent = data.summary?.ascendant || '—'
}

function setStatus(text, isError = false) {
  const status = document.getElementById('status')
  status.textContent = text
  status.classList.toggle('feedback--error', isError)
}

function bindActions() {
  const form = document.getElementById('astro-form')
  const chartBtn = document.getElementById('download-chart')
  const pdfBtn = document.getElementById('download-pdf')
  const copyJsonBtn = document.getElementById('copy-json')

  let currentData = null
  let currentEntries = []

  function updateUI(data) {
    currentData = data
    const entries = buildInterpretation(data, data.meta.language)
    currentEntries = entries
    renderMeta(data)
    renderSummary(data)
    renderChart(data)
    renderPositions(data.positions)
    renderHouses(data.houses)
    renderAspects(data.aspects)
    renderTiming(data)
    renderInterpretation(entries, data.meta.language)
    renderDataOutput(data)
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    setStatus('Calculando mapa com efemérides...')
    try {
      const data = await requestChart(form)
      updateUI(data)
      setStatus('Mapa atualizado com dados astrológicos reais.')
      if (form.storeHistory?.checked) {
        const history = JSON.parse(localStorage.getItem('astro-history') || '[]')
        history.unshift(data.meta)
        localStorage.setItem('astro-history', JSON.stringify(history.slice(0, 10)))
      }
    } catch (error) {
      setStatus(error.message, true)
    }
  })

  chartBtn.addEventListener('click', downloadChart)
  pdfBtn.addEventListener('click', () => currentData && downloadPDF(currentData, currentEntries))
  copyJsonBtn.addEventListener('click', () => {
    if (!currentData) return
    navigator.clipboard.writeText(JSON.stringify(currentData, null, 2))
    copyJsonBtn.textContent = 'Copiado!'
    setTimeout(() => (copyJsonBtn.textContent = 'Copiar JSON'), 1500)
  })

  const demoEvent = new Event('submit')
  form.dispatchEvent(demoEvent)
}

bindActions()
