import './style.css'
import { cityToLocation } from './cityTransform'

type PotterCharacter = {
  fullName: string
  nickname: string
  hogwartsHouse: string
  interpretedBy: string
  children: string[]
  image: string
  birthdate: string
  index: number
}

const form = document.querySelector<HTMLFormElement>('#searchForm')
const input = document.querySelector<HTMLInputElement>('#cityInput')
const result = document.querySelector<HTMLDivElement>('#result')

const hpForm = document.querySelector<HTMLFormElement>('#hpSearchForm')
const hpInput = document.querySelector<HTMLInputElement>('#hpCharacterInput')
const hpResult = document.querySelector<HTMLDivElement>('#hpResult')

function setResult(message: string) {
  if (result) {
    result.textContent = message
  }
}

function setHpResult(message: string) {
  if (hpResult) {
    hpResult.textContent = message
  }
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function buildTempChart(times: string[], temps: number[]) {
  if (times.length === 0 || temps.length === 0) {
    return ''
  }

  const width = 640
  const height = 180
  const pad = 24
  const safeTemps = temps.filter(t => Number.isFinite(t))
  if (safeTemps.length === 0) {
    return ''
  }

  let min = Math.min(...safeTemps)
  let max = Math.max(...safeTemps)
  if (min === max) {
    min -= 1
    max += 1
  }

  const plotWidth = width - pad * 2
  const plotHeight = height - pad * 2
  const step = safeTemps.length > 1 ? plotWidth / (safeTemps.length - 1) : plotWidth

  const points = safeTemps
    .map((temp, index) => {
      const x = pad + index * step
      const y = pad + (1 - (temp - min) / (max - min)) * plotHeight
      return `${x},${y}`
    })
    .join(' ')

  const area = `${pad},${height - pad} ${points} ${width - pad},${height - pad}`

  const labelTimes = times
    .filter((_, index) => index === 0 || index === Math.floor(times.length / 2) || index === times.length - 1)
    .map(value => value.slice(11, 16))

  return `
    <div class="chart-wrapper">
      <div class="chart-title">Temperature (next 24h)</div>
      <svg class="weather-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Temperature chart">
        <polyline class="chart-area" points="${area}" />
        <polyline class="chart-line" points="${points}" />
        <text class="chart-label" x="${pad}" y="${height - 6}">${labelTimes[0] ?? ''}</text>
        <text class="chart-label" x="${width / 2}" y="${height - 6}" text-anchor="middle">${labelTimes[1] ?? ''}</text>
        <text class="chart-label" x="${width - pad}" y="${height - 6}" text-anchor="end">${labelTimes[2] ?? ''}</text>
      </svg>
      <div class="chart-range">Min ${min.toFixed(1)}°C · Max ${max.toFixed(1)}°C</div>
    </div>
  `
}

async function searchWeather(event: Event) {
  event.preventDefault()
  const city = input?.value ?? ''
  if (!city.trim()) {
    setResult('Enter a city name.')
    return
  }

  setResult('Loading...')
  try {
    const location = await cityToLocation(city)
    if (!location) {
      setResult('City not found.')
      return
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(location.latitude))
    url.searchParams.set('longitude', String(location.longitude))
    url.searchParams.set('current', 'temperature_2m')
    url.searchParams.set('timezone', location.timezone ?? 'auto')
    url.searchParams.set('hourly', 'temperature_2m')
    url.searchParams.set('forecast_days', '1')

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Weather failed: ${res.status}`)
    }
    const data = await res.json()
    const temp = data?.current?.temperature_2m
    if (typeof temp !== 'number') {
      setResult('No temperature data.')
      return
    }
    const times = Array.isArray(data?.hourly?.time) ? data.hourly.time : []
    const temps = Array.isArray(data?.hourly?.temperature_2m) ? data.hourly.temperature_2m : []
    const chart = buildTempChart(times.slice(0, 24), temps.slice(0, 24))
    if (result) {
      result.innerHTML = `
        <div class="weather-summary">
          <h3>${location.name}</h3>
          <p>Current: ${temp} °C</p>
        </div>
        ${chart}
      `
    }
  } catch (error) {
    setResult('Error fetching weather.')
    console.error(error)
  }
}

async function searchCharacter(event: Event) {
  event.preventDefault()
  const query = hpInput?.value ?? ''
  if (!query.trim()) {
    setHpResult('Enter a character name.')
    return
  }

  setHpResult('Loading...')
  try {
    const res = await fetch('https://potterapi-fedeperin.vercel.app/es/characters')
    if (!res.ok) {
      throw new Error(`Potter API failed: ${res.status}`)
    }
    const list = (await res.json()) as PotterCharacter[]
    const q = normalize(query)
    const match =
      list.find(c => normalize(c.fullName).includes(q)) ??
      list.find(c => normalize(c.nickname).includes(q))

    if (!match) {
      setHpResult('Character not found.')
      return
    }

    if (hpResult) {
      hpResult.innerHTML = `
        <h3>${match.fullName}</h3>
        <p>Nickname: ${match.nickname || '-'}</p>
        <p>House: ${match.hogwartsHouse || '-'}</p>
        <p>Actor: ${match.interpretedBy || '-'}</p>
        <p>Birthdate: ${match.birthdate || '-'}</p>
        <img src="${match.image}" alt="${match.fullName}" width="160" />
      `
    }
  } catch (error) {
    setHpResult('Error fetching character.')
    console.error(error)
  }
}

form?.addEventListener('submit', searchWeather)
hpForm?.addEventListener('submit', searchCharacter)

type QuoteResponse = {
  content: string
  author: string
}

const quoteButton = document.querySelector<HTMLButtonElement>('#quoteButton')
const quoteResult = document.querySelector<HTMLDivElement>('#quoteResult')

const countryForm = document.querySelector<HTMLFormElement>('#countryForm')
const countryInput = document.querySelector<HTMLInputElement>('#countryInput')
const countryResult = document.querySelector<HTMLDivElement>('#countryResult')

const adviceButton = document.querySelector<HTMLButtonElement>('#adviceButton')
const adviceResult = document.querySelector<HTMLDivElement>('#adviceResult')

const catFactButton = document.querySelector<HTMLButtonElement>('#catFactButton')
const catFactResult = document.querySelector<HTMLDivElement>('#catFactResult')

const dogFactButton = document.querySelector<HTMLButtonElement>('#dogFactButton')
const dogFactResult = document.querySelector<HTMLDivElement>('#dogFactResult')

const jokeButton = document.querySelector<HTMLButtonElement>('#jokeButton')
const jokeResult = document.querySelector<HTMLDivElement>('#jokeResult')

const activityButton = document.querySelector<HTMLButtonElement>('#activityButton')
const activityResult = document.querySelector<HTMLDivElement>('#activityResult')

const ageForm = document.querySelector<HTMLFormElement>('#ageForm')
const ageInput = document.querySelector<HTMLInputElement>('#ageInput')
const ageResult = document.querySelector<HTMLDivElement>('#ageResult')

const dictionaryForm = document.querySelector<HTMLFormElement>('#dictionaryForm')
const dictionaryInput = document.querySelector<HTMLInputElement>('#dictionaryInput')
const dictionaryResult = document.querySelector<HTMLDivElement>('#dictionaryResult')

const pokemonForm = document.querySelector<HTMLFormElement>('#pokemonForm')
const pokemonInput = document.querySelector<HTMLInputElement>('#pokemonInput')
const pokemonResult = document.querySelector<HTMLDivElement>('#pokemonResult')

const cocktailForm = document.querySelector<HTMLFormElement>('#cocktailForm')
const cocktailInput = document.querySelector<HTMLInputElement>('#cocktailInput')
const cocktailResult = document.querySelector<HTMLDivElement>('#cocktailResult')

const githubForm = document.querySelector<HTMLFormElement>('#githubForm')
const githubInput = document.querySelector<HTMLInputElement>('#githubInput')
const githubResult = document.querySelector<HTMLDivElement>('#githubResult')

function setQuoteResult(message: string) {
  if (quoteResult) {
    quoteResult.textContent = message
  }
}

async function fetchRandomQuote() {
  setQuoteResult('Loading...')
  try {
    const res = await fetch('https://api.quotable.io/random')
    if (!res.ok) {
      throw new Error(`Quotes API failed: ${res.status}`)
    }
    const data = (await res.json()) as QuoteResponse
    if (quoteResult) {
      quoteResult.innerHTML = `
        <p>"${data.content}"</p>
        <p>- ${data.author}</p>
      `
    }
  } catch (error) {
    setQuoteResult('Error fetching quote.')
    console.error(error)
  }
}

quoteButton?.addEventListener('click', fetchRandomQuote)

type CountryResponse = {
  name: {
    common: string
    official: string
  }
  capital?: string[]
  population: number
  region: string
  flags?: {
    png?: string
    svg?: string
  }
}

function setCountryResult(message: string) {
  if (countryResult) {
    countryResult.textContent = message
  }
}

async function searchCountry(event: Event) {
  event.preventDefault()
  const query = countryInput?.value ?? ''
  if (!query.trim()) {
    setCountryResult('Enter a country name.')
    return
  }

  setCountryResult('Loading...')
  try {
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Countries API failed: ${res.status}`)
    }
    const data = (await res.json()) as CountryResponse[]
    const country = data[0]
    if (!country) {
      setCountryResult('Country not found.')
      return
    }

    const flag = country.flags?.png ?? country.flags?.svg ?? ''
    const capital = country.capital?.[0] ?? '-'
    if (countryResult) {
      countryResult.innerHTML = `
        <h3>${country.name.common}</h3>
        <p>Official: ${country.name.official}</p>
        <p>Region: ${country.region}</p>
        <p>Capital: ${capital}</p>
        <p>Population: ${country.population.toLocaleString()}</p>
        ${flag ? `<img src="${flag}" alt="${country.name.common} flag" width="140" />` : ''}
      `
    }
  } catch (error) {
    setCountryResult('Error fetching country.')
    console.error(error)
  }
}

countryForm?.addEventListener('submit', searchCountry)

type AdviceResponse = {
  slip: {
    advice: string
  }
}

function setAdviceResult(message: string) {
  if (adviceResult) {
    adviceResult.textContent = message
  }
}

async function fetchAdvice() {
  setAdviceResult('Loading...')
  try {
    const res = await fetch('https://api.adviceslip.com/advice')
    if (!res.ok) {
      throw new Error(`Advice API failed: ${res.status}`)
    }
    const data = (await res.json()) as AdviceResponse
    setAdviceResult(`"${data.slip.advice}"`)
  } catch (error) {
    setAdviceResult('Error fetching advice.')
    console.error(error)
  }
}

adviceButton?.addEventListener('click', fetchAdvice)

type CatFactResponse = {
  fact: string
}

function setCatFactResult(message: string) {
  if (catFactResult) {
    catFactResult.textContent = message
  }
}

async function fetchCatFact() {
  setCatFactResult('Loading...')
  try {
    const res = await fetch('https://catfact.ninja/fact')
    if (!res.ok) {
      throw new Error(`Cat API failed: ${res.status}`)
    }
    const data = (await res.json()) as CatFactResponse
    setCatFactResult(`"${data.fact}"`)
  } catch (error) {
    setCatFactResult('Error fetching cat fact.')
    console.error(error)
  }
}

catFactButton?.addEventListener('click', fetchCatFact)

type DogFactResponse = {
  data: Array<{
    attributes: {
      body: string
    }
  }>
}

async function fetchDogFact() {
  if (!dogFactResult) {
    return
  }
  dogFactResult.textContent = 'Loading...'
  try {
    const res = await fetch('https://dogapi.dog/api/v2/facts?limit=1')
    if (!res.ok) {
      throw new Error(`Dog API failed: ${res.status}`)
    }
    const data = (await res.json()) as DogFactResponse
    const fact = data.data?.[0]?.attributes?.body ?? 'No fact'
    dogFactResult.textContent = `"${fact}"`
  } catch (error) {
    dogFactResult.textContent = 'Error fetching dog fact.'
    console.error(error)
  }
}

dogFactButton?.addEventListener('click', fetchDogFact)

type JokeResponse = {
  setup: string
  punchline: string
}

async function fetchJoke() {
  if (!jokeResult) {
    return
  }
  jokeResult.textContent = 'Loading...'
  try {
    const res = await fetch('https://official-joke-api.appspot.com/jokes/random')
    if (!res.ok) {
      throw new Error(`Joke API failed: ${res.status}`)
    }
    const data = (await res.json()) as JokeResponse
    jokeResult.innerHTML = `
      <p>${data.setup}</p>
      <p>${data.punchline}</p>
    `
  } catch (error) {
    jokeResult.textContent = 'Error fetching joke.'
    console.error(error)
  }
}

jokeButton?.addEventListener('click', fetchJoke)

type MealResponse = {
  meals: Array<{
    strMeal: string
    strCategory: string
    strArea: string
    strMealThumb: string
  }>
}

async function fetchActivity() {
  if (!activityResult) {
    return
  }
  activityResult.textContent = 'Loading...'
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    if (!res.ok) {
      throw new Error(`Meal API failed: ${res.status}`)
    }
    const data = (await res.json()) as MealResponse
    const meal = data.meals?.[0]
    if (!meal) {
      activityResult.textContent = 'No meal found.'
      return
    }
    activityResult.innerHTML = `
      <p>${meal.strMeal}</p>
      <p>${meal.strCategory} · ${meal.strArea}</p>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" width="160" />
    `
  } catch (error) {
    activityResult.textContent = 'Error fetching meal.'
    console.error(error)
  }
}

activityButton?.addEventListener('click', fetchActivity)

type AgeResponse = {
  name: string
  age: number | null
  count: number
}

async function searchAge(event: Event) {
  event.preventDefault()
  const name = ageInput?.value ?? ''
  if (!name.trim()) {
    if (ageResult) {
      ageResult.textContent = 'Enter a name.'
    }
    return
  }

  if (ageResult) {
    ageResult.textContent = 'Loading...'
  }
  try {
    const url = `https://api.agify.io?name=${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Age API failed: ${res.status}`)
    }
    const data = (await res.json()) as AgeResponse
    const ageText = data.age === null ? 'Unknown' : String(data.age)
    if (ageResult) {
      ageResult.innerHTML = `
        <p>Name: ${data.name}</p>
        <p>Age: ${ageText}</p>
        <p>Count: ${data.count}</p>
      `
    }
  } catch (error) {
    if (ageResult) {
      ageResult.textContent = 'Error fetching age.'
    }
    console.error(error)
  }
}

ageForm?.addEventListener('submit', searchAge)

type DictionaryResponse = Array<{
  word: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
    }>
  }>
}>

async function searchDictionary(event: Event) {
  event.preventDefault()
  const word = dictionaryInput?.value ?? ''
  if (!word.trim()) {
    if (dictionaryResult) {
      dictionaryResult.textContent = 'Enter a word.'
    }
    return
  }
  if (dictionaryResult) {
    dictionaryResult.textContent = 'Loading...'
  }
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Dictionary API failed: ${res.status}`)
    }
    const data = (await res.json()) as DictionaryResponse
    const first = data[0]
    const meaning = first?.meanings?.[0]
    const definition = meaning?.definitions?.[0]?.definition
    if (!definition) {
      if (dictionaryResult) {
        dictionaryResult.textContent = 'No definition found.'
      }
      return
    }
    if (dictionaryResult) {
      dictionaryResult.innerHTML = `
        <p>Word: ${first.word}</p>
        <p>Type: ${meaning.partOfSpeech}</p>
        <p>${definition}</p>
      `
    }
  } catch (error) {
    if (dictionaryResult) {
      dictionaryResult.textContent = 'Error fetching definition.'
    }
    console.error(error)
  }
}

dictionaryForm?.addEventListener('submit', searchDictionary)

type PokemonResponse = {
  name: string
  sprites: {
    front_default: string | null
  }
  types: Array<{
    type: { name: string }
  }>
}

async function searchPokemon(event: Event) {
  event.preventDefault()
  const name = pokemonInput?.value ?? ''
  if (!name.trim()) {
    if (pokemonResult) {
      pokemonResult.textContent = 'Enter a pokemon name.'
    }
    return
  }
  if (pokemonResult) {
    pokemonResult.textContent = 'Loading...'
  }
  try {
    const query = name.toLowerCase().trim()
    const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`
    let res = await fetch(url)
    if (!res.ok) {
      const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000')
      if (!listRes.ok) {
        throw new Error(`Pokemon list failed: ${listRes.status}`)
      }
      const listData = (await listRes.json()) as { results: Array<{ name: string }> }
      const match = listData.results.find(item => item.name.startsWith(query))
      if (!match) {
        if (pokemonResult) {
          pokemonResult.textContent = 'Pokemon not found.'
        }
        return
      }
      res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(match.name)}`)
      if (!res.ok) {
        throw new Error(`Pokemon API failed: ${res.status}`)
      }
    }
    const data = (await res.json()) as PokemonResponse
    const types = data.types.map(t => t.type.name).join(', ')
    const img = data.sprites.front_default
    if (pokemonResult) {
      pokemonResult.innerHTML = `
        <p>Name: ${data.name}</p>
        <p>Types: ${types}</p>
        ${img ? `<img src="${img}" alt="${data.name}" width="120" />` : ''}
      `
    }
  } catch (error) {
    if (pokemonResult) {
      pokemonResult.textContent = 'Error fetching pokemon.'
    }
    console.error(error)
  }
}

pokemonForm?.addEventListener('submit', searchPokemon)

type CocktailResponse = {
  drinks: Array<{
    strDrink: string
    strCategory: string
    strAlcoholic: string
    strDrinkThumb: string
  }> | null
}

async function searchCocktail(event: Event) {
  event.preventDefault()
  const name = cocktailInput?.value ?? ''
  if (!name.trim()) {
    if (cocktailResult) {
      cocktailResult.textContent = 'Enter a cocktail name.'
    }
    return
  }
  if (cocktailResult) {
    cocktailResult.textContent = 'Loading...'
  }
  try {
    const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Cocktail API failed: ${res.status}`)
    }
    const data = (await res.json()) as CocktailResponse
    const first = data.drinks?.[0]
    if (!first) {
      if (cocktailResult) {
        cocktailResult.textContent = 'No cocktail found.'
      }
      return
    }
    if (cocktailResult) {
      cocktailResult.innerHTML = `
        <p>Name: ${first.strDrink}</p>
        <p>Category: ${first.strCategory}</p>
        <p>Type: ${first.strAlcoholic}</p>
        <img src="${first.strDrinkThumb}" alt="${first.strDrink}" width="140" />
      `
    }
  } catch (error) {
    if (cocktailResult) {
      cocktailResult.textContent = 'Error fetching cocktail.'
    }
    console.error(error)
  }
}

cocktailForm?.addEventListener('submit', searchCocktail)

type GitHubResponse = {
  login: string
  name: string | null
  public_repos: number
  followers: number
  html_url: string
  avatar_url: string
}

async function searchGitHubUser(event: Event) {
  event.preventDefault()
  const username = githubInput?.value ?? ''
  if (!username.trim()) {
    if (githubResult) {
      githubResult.textContent = 'Enter a username.'
    }
    return
  }

  if (githubResult) {
    githubResult.textContent = 'Loading...'
  }
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`GitHub API failed: ${res.status}`)
    }
    const data = (await res.json()) as GitHubResponse
    if (githubResult) {
      githubResult.innerHTML = `
        <p>User: ${data.name ?? data.login}</p>
        <p>Repos: ${data.public_repos}</p>
        <p>Followers: ${data.followers}</p>
        <p><a href="${data.html_url}" target="_blank" rel="noreferrer">Profile</a></p>
        <img src="${data.avatar_url}" alt="${data.login}" width="120" />
      `
    }
  } catch (error) {
    if (githubResult) {
      githubResult.textContent = 'Error fetching user.'
    }
    console.error(error)
  }
}

githubForm?.addEventListener('submit', searchGitHubUser)
