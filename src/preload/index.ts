import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qvacAPI', {
  loadModel: (): Promise<string> => ipcRenderer.invoke('load-model'),
  infer: (history: { role: string; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('infer', history),
  onModelProgress: (cb: (progress: { percentage: number; downloaded: number; total: number }) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: { percentage: number; downloaded: number; total: number }) => cb(progress)
    ipcRenderer.on('model-progress', listener)
    return () => ipcRenderer.removeListener('model-progress', listener)
  },
  onCompletionStream: (cb: (token: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, token: string) => cb(token)
    ipcRenderer.on('completion-stream', listener)
    return () => ipcRenderer.removeListener('completion-stream', listener)
  },
  unloadModel: (): Promise<string> => ipcRenderer.invoke('unload-model')
})
