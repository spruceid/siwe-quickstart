import './scss/style.scss';

const input = document.getElementById('input');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');

async function load() {
  const action = 'load';

  const headers = new window.Headers();
  headers.append('Accept', 'text/plain');

  const options = {
    body: JSON.stringify({
      action,
    }),
    headers,
    method: 'post',
  };

  window.fetch('http://localhost:8888', options).then(async (response) => {
    input.value = await response.text();
  });
}

async function save() {
  const action = 'save';

  const headers = new window.Headers();

  const options = {
    body: JSON.stringify({
      action,
      content: input.value,
    }),
    headers,
    method: 'post',
  };

  window.fetch('http://localhost:8888', options);
}

saveBtn.onclick = save;
loadBtn.onclick = load;
