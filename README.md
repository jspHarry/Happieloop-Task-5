**🚀 Real-Time Chat Application**

💬 WebSocket-Based Multi-Room Chat App using Node.js, Express & WS

A lightweight, real-time chat application that allows multiple users to join chat rooms, send messages instantly, and view chat history. Built with Node.js, Express, and WebSocket (ws) for fast, bidirectional communication.

**🌟 Features**

✅ Real-time messaging using WebSockets
✅ Multiple chat rooms (general, random, tech)
✅ Username support
✅ Room switching without disconnecting
✅ Message history persistence (stored locally)
✅ Automatic join/leave notifications
✅ Lightweight and fast
✅ Easy to set up and run

**🛠 Tech Stack**

Node.js

Express.js

WebSocket (ws)

UUID for unique message IDs

File System (fs) for message persistence

**📂 Project Structure**
chat-app/
│
├── server.js          # Main server file
├── messages.json      # Stored chat history
├── package.json       # Dependencies & scripts
└── public/            # Static frontend files (if added)

**⚡ Installation**

1️⃣ Clone the repository

git clone https://github.com/your-username/chat-app.git
cd chat-app


2️⃣ Install dependencies

npm install


3️⃣ Start the server

npm start


4️⃣ Open your browser:

http://localhost:8080

🔄 How It Works

Users connect via WebSocket

Each user joins a default room (general)

Messages are:

Broadcast only within the room

Stored in messages.json

Limited to the last 200 messages per room

**🧠 WebSocket Events**
Join Room
{
  "type": "join",
  "username": "Harry",
  "room": "tech"
}

Send Message
{
  "type": "message",
  "text": "Hello everyone!"
}

Switch Room
{
  "type": "switch",
  "room": "random"
}

💾 Message Persistence

Messages are saved in:

messages.json


Only the last 200 messages per room are stored

Loaded automatically when the server restarts

**🔒 Default Chat Rooms**

general

random

tech

**🚀 Future Improvements**

Private messaging

User authentication

Typing indicators

Message reactions

Database integration

Frontend UI enhancements

**🤝 Contributing**

Contributions are welcome!

Fork the repository

Create a feature branch

Submit a pull request
