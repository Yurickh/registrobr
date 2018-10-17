import fetch from 'node-fetch'
const BASE_URL = 'https://registro.br/ajax/avail/';

export default function fetchAvailableDomains(url: string) {
  return fetch(`${BASE_URL}${url}`, {})
    .then(response => response.json())
}
