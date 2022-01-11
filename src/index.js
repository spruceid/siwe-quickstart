const input = document.getElementById('input')
const saveBtn = document.getElementById('saveBtn')
const loadBtn = document.getElementById('loadBtn')
const appDiv = document.getElementById('app')

saveBtn.onclick = save
loadBtn.onclick = load

const domain = window.location.hostname

async function load () {
  const headers = new window.Headers()
  headers.append('Accept', 'text/plain')

  const options = {
    body: JSON.stringify({
      action: 'load'
    }),
    headers: headers,
    method: 'post'
  }

  window.fetch('http://localhost:8888', options).then(async response => {
    input.value = await response.text()
  })
}

async function save () {
  const headers = new window.Headers()

  const options = {
    body: JSON.stringify({
      action: 'save',
      content: input.value
    }),
    headers: headers,
    method: 'post'
  }

  window.fetch('http://localhost:8888', options)
}
