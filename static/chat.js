(function() {
    // DOM Elements
    const messagesContainer = document.getElementById('chatMessages');
    const messageForm = document.getElementById('messageForm');
    const userInput = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');

    // Helper: Format current time (HH:MM)
    function getFormattedTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Helper: Add a message to the UI
    function addMessage(messageText, sender, timeString = null) {
        const messageTime = timeString || getFormattedTime();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Avatar icon based on sender
        const avatarIcon = sender === 'received' ? 'fa-microscope' : 'fa-user-md';
        const avatarBg = sender === 'received' ? '#1e4028' : '#2c553a';
        
        messageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${avatarBg};">
                <i class="fas ${avatarIcon}"></i>
            </div>
            <div class="message-bubble">
                <p>${escapeHtml(messageText)}</p>
                <span class="message-time">${messageTime}</span>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    // Helper: escape HTML to prevent injection
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Scroll to bottom smoothly
    function scrollToBottom() {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Show typing indicator (bot is thinking)
    let typingIndicatorElement = null;
    function showTypingIndicator() {
        removeTypingIndicator();
        typingIndicatorElement = document.createElement('div');
        typingIndicatorElement.className = 'message received';
        typingIndicatorElement.id = 'typingIndicator';
        typingIndicatorElement.innerHTML = `
            <div class="message-avatar" style="background: #1e4028;">
                <i class="fas fa-microscope"></i>
            </div>
            <div class="typing-indicator">
                <span></span><span></span><span></span>
                <span style="margin-left: 6px; font-size: 0.75rem; color: #bbdfc7;">MediAssist is responding</span>
            </div>
        `;
        messagesContainer.appendChild(typingIndicatorElement);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
    }

    // Send message to backend (Flask endpoint /get)
    async function sendMessageToBackend(userMsg) {
        try {
            const formData = new URLSearchParams();
            formData.append('msg', userMsg);
            
            const response = await fetch('/get', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
            const botReply = await response.text();
            return botReply;
        } catch (error) {
            console.error('API Error:', error);
            return "I'm having trouble connecting to the medical database. Please check your network or try again in a moment.";
        }
    }

    // Main action: handle user message submission
    async function handleSendMessage(event) {
        event.preventDefault();
        
        const rawMessage = userInput.value.trim();
        if (!rawMessage) return;
        
        // Disable input & button while processing
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // Add user message to chat
        addMessage(rawMessage, 'sent', getFormattedTime());
        
        // Clear input field
        userInput.value = '';
        
        // Show typing indicator from bot
        showTypingIndicator();
        
        // Send to backend
        const botResponse = await sendMessageToBackend(rawMessage);
        
        // Remove typing indicator and add bot response
        removeTypingIndicator();
        
        let finalReply = botResponse;
        if (!botResponse || botResponse.trim() === '') {
            finalReply = "I appreciate your query. For accurate medical insights, please rephrase or consult a physician directly.";
        }
        
        addMessage(finalReply, 'received', getFormattedTime());
        
        // Re-enable input after everything
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }

    // On page load: initialize welcome message (if needed, but also ensure we have fresh start)
    function initializeChat() {
        // Clear any existing demo messages except welcome
        // (avoid duplication if already present by checking children count)
        if (messagesContainer.children.length === 0) {
            const welcomeTime = getFormattedTime();
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'message received';
            welcomeDiv.innerHTML = `
                <div class="message-avatar" style="background: #1e4028;">
                    <i class="fas fa-microscope"></i>
                </div>
                <div class="message-bubble">
                    <p>Welcome to MediAssist. I provide clinical information and general medical guidance. How can I assist you today?</p>
                    <span class="message-time">${welcomeTime}</span>
                </div>
            `;
            messagesContainer.appendChild(welcomeDiv);
            scrollToBottom();
        } else {
            // Ensure last message scroll visible
            scrollToBottom();
        }
    }

    // Event listeners
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }
    if (sendButton) {
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleSendMessage(e);
        });
    }
    
    // Initialize chat UI and focus input
    initializeChat();
    if (userInput) userInput.focus();
    
})();