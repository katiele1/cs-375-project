let socket = null;

function setupWebSocket() {
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        let targetLobby = document.getElementById("lobby-select").value;
        let joinName;

        if (currentUser) {
            joinName = currentUser.username;
        } else {
            joinName = "Someone";
        }

        socket.send(JSON.stringify({
            type: 'join',
            username: joinName,
            lobby: targetLobby
        }));
    };

    socket.onmessage = (event) => {
        let packet = JSON.parse(event.data);

        if (packet.type === 'countUpdate') {
            let countDiv = document.getElementById('player-count');
            if (countDiv) {
                countDiv.textContent = `Players in lobby: ${packet.count}`
                return;
            }
        }

        if (packet.type === 'message') {
            let messagesList = document.getElementById('messages');
            let newMessage = document.createElement('li');
            newMessage.textContent = packet.text;
            messagesList.appendChild(newMessage);

            while (messagesList.children.length > 5) {
                messagesList.removeChild(messagesList.firstChild);
            }
        }
    };
}

function switchLobby() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        let newLobby = document.getElementById("lobby-select").value;
        clearMessages();
        socket.send(JSON.stringify({
            type: 'switchLobby',
            lobby: newLobby
        }));

        let messagesList = document.getElementById('messages');
    
    }
}

function clearMessages() {
    let messagesList = document.getElementById("messages");

    while (messagesList.firstChild) {
        messagesList.removeChild(messagesList.firstChild);
    }
}

document.getElementById('switch-lobby-button').addEventListener('click', switchLobby);