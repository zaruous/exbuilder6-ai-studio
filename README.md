
# eXbuilder6 AI Studio

eXbuilder6 AI Studio is an intelligent, web-based IDE designed to accelerate the development of eXbuilder6 applications. By leveraging Generative AI (Google Gemini, OpenAI, Ollama), it automates the creation of UI layouts (.clx), client-side logic (.js), and server-side Spring Boot code (.java).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![Vite](https://img.shields.io/badge/vite-5.x-646cff.svg)
![Tailwind](https://img.shields.io/badge/tailwindcss-3.x-38b2ac.svg)

## ✨ Key Features

*   **Prompt-to-Code**: Generate complex eXbuilder6 components from natural language descriptions.
*   **Full Stack Generation**:
    *   **UI Layout (.clx)**: Valid XML structure for eXbuilder6.
    *   **Client Logic (.js)**: Event handlers and data binding logic.
    *   **Server Code (.java)**: Spring Boot Controller, Service, and DTO/Model classes.
*   **Multi-Provider Support**: Switch seamlessly between Google Gemini, OpenAI, Local LLMs (Ollama), or custom Web Services.
*   **Live Dashboard**:
    *   Syntax-highlighted code editors (Monaco Editor).
    *   Project tree view for generated Java files.
    *   Real-time build logs.
    *   Visual mock preview of the generated UI.
*   **Customizable Settings**: Adjust temperature, output language (KR/EN), and base package naming.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/exbuilder6-ai-studio.git
    cd exbuilder6-ai-studio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory to store your API Key.
    
    ```properties
    # .env
    VITE_API_KEY=your_google_gemini_api_key_here
    ```
    > **Note**: The application is configured to map `VITE_API_KEY` to `process.env.API_KEY` during the build process.

4.  **Run the application**
    ```bash
    npm run dev
    ```
    The app will open automatically at `http://localhost:3000`.

## 📖 Usage Guide

1.  **Enter Prompt**: In the left panel, describe the component you want to build (e.g., "Create a customer registration form with validation").
2.  **Generate**: Click the "Build Component" button.
3.  **Review Output**: Use the tabs on the right to switch between:
    *   `Layout (.clx)`: Copy the XML code into eXbuilder6 Design View.
    *   `Controller (.js)`: Review the generated script logic.
    *   `Server (.java)`: Explore the generated Spring Boot files in the file tree.
    *   `Live Preview`: See a visual approximation of the component.
4.  **Configuration**: Click the Settings (gear icon) to change the AI model, adjust creativity, or switch to Korean output.

## 🔌 AI Providers

| Provider | Description | Configuration |
| :--- | :--- | :--- |
| **Google Gemini** | Default provider. Best for reasoning and code generation. | Requires `VITE_API_KEY` in `.env`. |
| **OpenAI** | Compatible with GPT-4o, GPT-3.5. | Set API Key in `.env` (custom setup required) or use Proxy. |
| **Ollama** | For local inference (e.g., Llama 3). | Ensure Ollama is running (`ollama serve`) and CORS is enabled (`OLLAMA_ORIGINS="*"`). |
| **Web Service** | Connect to your own custom AI backend. | See `서비스데이터.md` for the request/response protocol. |

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Lucide React (Icons)
*   **Editor**: @monaco-editor/react
*   **AI SDK**: @google/genai

## 📄 License

This project is licensed under the MIT License.
