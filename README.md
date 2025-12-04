# Falupita 🎱

> **Falupita** (a play on *Chalupa/Bingo*) is a serverless, AI-powered Bingo card generator.

## Features
*   **No Backend**: Runs entirely in the browser using React and ES Modules.
*   **AI Generated Images**: Uses Google's **Gemini Nano Banana** model (`gemini-2.5-flash-image`) to generate or restyle token images on the fly.
*   **Print Ready**: Exports shuffled, high-resolution PDF sheets and cut-out token guides.
*   **Session Management**: Save and load your progress via ZIP files.

## Setup & Usage

1.  **Get an API Key**:
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Create a **Paid** API Key (required for the image generation model).
    
2.  **Run the App**:
    *   **Option A (GitHub Pages)**: Fork this repo and enable GitHub Pages in Settings.
    *   **Option B (Local)**:
        *   Clone the repo.
        *   Run a static server (e.g., `python3 -m http.server` or VS Code Live Server).
        *   Open `index.html`.

3.  **Enter Key**:
    *   On first load, Falupita will ask for your API key.
    *   The key is stored securely in your browser's `localStorage`. It is never sent to any server other than Google's API.

## Customization
*   Edit `metadata.json` to change the PWA details.
*   Modify `DEFAULT_THEME` in `types.ts` to change the default colors.

## License
MIT
