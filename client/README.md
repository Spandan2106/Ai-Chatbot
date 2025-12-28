# Jarves AI Chatbot 🤖

A futuristic, voice-enabled AI assistant built with **React**, **Node.js**, and the **Google Gemini API**.

## ✨ Features

- **🧠 Multi-Model Support**: Switch between `gemini-2.5-flash-lite` (fast/free), `gemini-2.5-flash`, and `gemma-3` models.
- **🗣️ Voice Interaction**:
  - **Speech-to-Text**: Talk to Jarves using the microphone button.
  - **Text-to-Speech**: Jarves reads responses aloud (toggleable).
- **🎨 Futuristic UI**: Glassmorphism design, neon accents, and smooth animations.
- **⚡ Real-time Streaming**: Typewriter effect for AI responses.
- **🛑 Control**: Stop generating responses mid-stream.
- **📱 Responsive**: Fully optimized for desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS3 (Glassmorphism)
- **Backend**: Node.js, Express
- **AI**: Google Generative AI SDK (`@google/generative-ai`)

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Google API Key**: Get one for free at Google AI Studio.

### Installation

1.  **Navigate to the client directory**:
    ```bash
    cd client
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    - Create a `.env` file in the `client` directory.
    - Add your Gemini API key:
      ```env
      GEMINI_API_KEY=your_actual_api_key_here
      ```

### Running Locally

**Option 1: Full Stack (Recommended)**
Runs the backend server which serves the frontend (requires build).

```bash
# Build the frontend first
npm run build

# Start the server
npm run server
```
Visit `http://localhost:3001` in your browser.

## 🌍 Deployment (Render.com)

This project is configured to be deployed easily on Render.

1.  Push your code to GitHub (ensure `.env` is ignored).
2.  Create a new **Web Service** on Render.
3.  Connect your repository.
4.  **Settings**:
    - **Root Directory**: `client`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm run server`
5.  **Environment Variables**:
    - Add `GEMINI_API_KEY` with your Google API key.

## 🛡️ Privacy Note

- **API Keys**: Never commit your `.env` file to GitHub. The `.gitignore` is set up to prevent this.
- **Billing**: The default model `gemini-2.5-flash-lite` is free-tier friendly.