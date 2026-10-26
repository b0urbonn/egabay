// AI assistant — preview chat with canned replies (no backend yet).

const assistantButton = document.getElementById('assistant-btn');
const assistantPanel = document.getElementById('assistant-chat-panel');
const assistantClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function openAssistant() {
  assistantPanel.classList.add('open');
  assistantButton.hidden = true;
  assistantButton.setAttribute('aria-expanded', 'true');
  chatInput.focus();
}

function closeAssistant() {
  assistantPanel.classList.remove('open');
  assistantButton.hidden = false;
  assistantButton.setAttribute('aria-expanded', 'false');
  assistantButton.focus();
}

function addChatMessage(text, sender) {
  const row = document.createElement('div');
  row.className = 'chat-row ' + sender;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function getAssistantReply(question) {
  const query = question.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good afternoon)\b/.test(query)) {
    return 'Hello! I can help you think through a Marinduque trip. Ask me about map help, travel tips, or planning a route.';
  }
  if (/trip|route|destination|plan|travel to/.test(query)) {
    return 'Tell me your starting point and destination, and I can help you plan the next step. Map directions are road estimates; they do not include verified jeepney or tricycle schedules.';
  }
  if (/map|search|find|place/.test(query)) {
    return 'Use the search box at the top of the map to find a place in Marinduque. Select a result to see its location and a mapped road route from Boac.';
  }
  if (/tip|safety|prepare|before/.test(query)) {
    return 'Before leaving, confirm current fares and departure times with local operators. Allow extra time for road conditions, and keep a little cash for local rides.';
  }
  if (/terminal|port|ferry/.test(query)) {
    return 'The map includes sample markers for Balanacan, Cawit, and Buyabod port terminals. Please confirm current ferry departures locally before traveling.';
  }
  return 'I’m a preview assistant, so I don’t have live schedules, fares, or vehicle updates yet. Try asking about trip planning, map help, or travel tips.';
}

function sendChatMessage(message) {
  const text = message.trim();
  if (!text) return;
  addChatMessage(text, 'user');
  chatInput.value = '';
  const pendingReply = addChatMessage('One moment…', 'bot');
  setTimeout(() => {
    pendingReply.textContent = getAssistantReply(text);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 320);
}

assistantButton.addEventListener('click', openAssistant);
assistantClose.addEventListener('click', closeAssistant);
chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChatMessage(chatInput.value);
  chatInput.focus();
});
document.querySelectorAll('.quick-reply').forEach((button) => {
  button.addEventListener('click', () => sendChatMessage(button.textContent));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && assistantPanel.classList.contains('open')) closeAssistant();
});
