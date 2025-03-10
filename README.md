
# Real-time Chat Application with Video/Audio Calls

This application is a full-featured chat application with text messaging and video/audio call capabilities. It uses:

- Next JS + TypeScript for the frontend
- FastAPI (Python) for the backend
- Centrifugo for real-time WebSocket communication
- WebRTC for peer-to-peer audio/video calls

## Prerequisites

- Node.js 16+ and NPM
- Python 3.8+
- Docker and Docker Compose (for running Centrifugo)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Setup backend

Navigate to the backend directory and create a .env file:

```bash
cd backend
cp .env.example .env
```

Edit the .env file and set your own values:

```
# Server
API_PORT=8000

# Centrifugo
CENTRIFUGO_API_KEY=your-centrifugo-api-key
CENTRIFUGO_API_URL=http://localhost:8001/api
CENTRIFUGO_WS_URL=ws://localhost:8001/connection/websocket

# Auth
JWT_SECRET=your-jwt-secret-key
JWT_ALGORITHM=HS256
```

Also update the `centrifugo.json` file with your own secret keys.

### 3. Start the backend and Centrifugo using Docker Compose

```bash
docker-compose up -d
```

This will start both the Python API and Centrifugo server.

### 4. Setup frontend

Navigate to the frontend directory and install dependencies:

```bash
cd ..  # Go back to the project root
npm install
```

### 5. Start the frontend development server

```bash
npm run dev
```

Now your application should be running at <http://localhost:3000>.

## Features

- Real-time text messaging
- Audio and video calls
- User status updates (online/offline)
- Message read/delivery status
- User authentication
- Responsive design

## Architecture

### Frontend

- React for UI components
- React Router for navigation
- React Query for data fetching and caching
- WebRTC for peer-to-peer audio/video communication

### Backend

- FastAPI for the API layer
- Centrifugo for WebSocket communication
- JWT for authentication

### Communication Flow

1. **Text Messages**:
   - Client sends message to the API
   - API broadcasts the message via Centrifugo
   - Receiving client gets the message in real-time

2. **Call Signaling**:
   - Client sends call signal to the API
   - API broadcasts the signal via Centrifugo
   - Receiving client establishes WebRTC connection

## License

[MIT](LICENSE)
