export type CityLocation = {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  timezone?: string
}

type GeocodingResponse = {
  results?: Array<{
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
    timezone?: string
  }>
}

export async function cityToLocation(city: string): Promise<CityLocation | null> {
  const trimmed = city.trim()
  if (!trimmed) {
    return null
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'es')
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`)
  }

  const data = (await res.json()) as GeocodingResponse
  const first = data.results?.[0]
  if (!first) {
    return null
  }

  return {
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
    country: first.country,
    admin1: first.admin1,
    timezone: first.timezone,
  }
}
