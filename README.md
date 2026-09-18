# LocalStudy

A local-first desktop study assistant powered by [QVAC](https://qvac.tether.io/).

LocalStudy runs a language model on the user's own machine through QVAC. It does not use an AI API key or send prompts to a cloud inference service.

## What it demonstrates

- Electron + React desktop app
- QVAC SDK `0.19.1`
- `loadModel()` for local model loading
- `completion()` for on-device text generation
- Streaming tokens from the Electron main process to the UI through a safe preload bridge
- First-run model download and progress UI

## Requirements

- Node.js `22.17+`
- npm `10.9+`
- A machine supported by QVAC's current system requirements

## Run locally

```bash
npm install
QVAC_CONFIG_PATH=./qvac.config.json npm run dev
```

On Windows PowerShell:

```powershell
npm install
$env:QVAC_CONFIG_PATH="./qvac.config.json"
npm run dev
```

The first launch downloads the selected model. Subsequent launches use QVAC's local cache.

## Build

```bash
npm run build
```

To package the desktop application:

```bash
npm run package
```

To create a distributable archive:

```bash
npm run make
```

## QVAC implementation

The QVAC integration lives in `src/main/index.ts`. The app calls:

```ts
const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: 'llm'
})

const result = completion({ modelId, history, stream: true })
```

No remote AI provider is called by the application. QVAC 0.19.x removed delegated/provider inference; loaded models run locally.

## Project structure

```text
src/
  main/       Electron main process + QVAC
  preload/    isolated IPC bridge
  renderer/   React UI
```

## Privacy

The app is designed around local inference: the conversation is passed from the renderer to the Electron main process and then into QVAC. There is no application backend, API key, or cloud LLM endpoint.

The QVAC runtime may download the model on first use; after that, inference is performed locally according to QVAC's local runtime.

## License

MIT. See `LICENSE`.

## Credits

Built with the open-source QVAC SDK by Tether.
