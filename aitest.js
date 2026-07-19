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
    statusEl.textContent = 'Enter your OpenRouter API key first.';
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
        messages: messages,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    // Always log the full raw response so it can be inspected in DevTools console.
    console.log('OpenRouter raw response:', data);

    if (!response.ok) {
      const errMsg = (data.error && data.error.message) || JSON.stringify(data);
      addMessage('error', 'Error ' + response.status + ': ' + errMsg);
      statusEl.textContent = 'Request failed — key may be invalid or model unavailable.';
      return;
    }

    const choice = data.choices && data.choices[0];
    const msg = choice && choice.message;

    // Some reasoning models put text in message.content; if that's empty,
    // fall back to reasoning text, or show the finish_reason for debugging.
    let reply = msg && msg.content ? msg.content : '';
    if (!reply && msg && msg.reasoning) {
      reply = '(model returned only reasoning, no final answer)\n\n' + msg.reasoning;
    }
    if (!reply) {
      reply = '(no content returned) — raw response logged to browser console. finish_reason: ' +
        (choice && choice.finish_reason ? choice.finish_reason : 'unknown');
    }

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
