import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import {
  LLAMA_3_2_1B_INST_Q4_0,
  loadModel,
  unloadModel,
  completion
} from '@qvac/sdk'

app.commandLine.appendSwitch('no-sandbox')

let win: BrowserWindow | null = null
let modelId: string | null = null
let loadingPromise: Promise<string> | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 820,
    minHeight: 620,
    show: false,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win?.show())
  win.on('closed', () => { win = null })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function ensureModel(): Promise<string> {
  if (modelId) return modelId
  if (loadingPromise) return loadingPromise

  loadingPromise = loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: 'llm',
    onProgress: (progress) => {
      win?.webContents.send('model-progress', {
        percentage: progress.percentage,
        downloaded: progress.downloaded,
        total: progress.total
      })
    }
  })

  try {
    modelId = await loadingPromise
    return modelId
  } finally {
    loadingPromise = null
  }
}

function setupHandlers(): void {
  ipcMain.handle('load-model', async () => {
    await ensureModel()
    return 'model loaded'
  })

  ipcMain.handle('infer', async (_event, history: { role: string; content: string }[]) => {
    const id = await ensureModel()
    const result = completion({ modelId: id, history, stream: true })
    for await (const token of result.tokenStream) {
      win?.webContents.send('completion-stream', token)
    }
    win?.webContents.send('completion-stream', '')
  })

  ipcMain.handle('unload-model', async () => {
    if (!modelId) return 'model unloaded'
    await unloadModel({ modelId })
    modelId = null
    return 'model unloaded'
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.sujosh.localstudy')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createWindow()
  setupHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  if (modelId) {
    try { await unloadModel({ modelId }) } catch { /* best effort during shutdown */ }
    modelId = null
  }
})
