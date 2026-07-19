const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const chatLog = document.getElementById('chatLog');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const statusEl = document.getElementById('status');

const messages = [];

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendMessage() {
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();
  const text = userInput.value.trim();

  if (!apiKey) {
    statusEl.textContent = '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';
    return;
  }
  if (!text) return;

  addMessage('user', text);
  messages.push({ role: 'user', content: text });
  userInput.value = '';
  sendBtn.disabled = true;
  statusEl.textContent = 'Sending request...';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = (data.error && data.error.message) || JSON.stringify(data);
      addMessage('error', 'Error ' + response.status + ': ' + errMsg);
      statusEl.textContent = 'Request failed — key may be invalid or model unavailable.';
      return;
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '(no content returned)';

    addMessage('assistant', reply);
    messages.push({ role: 'assistant', content: reply });
    statusEl.textContent = 'Success — your key works.';
  } catch (err) {
    addMessage('error', 'Network/JS error: ' + err.message);
    statusEl.textContent = 'Request failed.';
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
