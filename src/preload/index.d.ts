declare global {
  interface Window {
    qvacAPI: {
      loadModel: () => Promise<string>
      infer: (history: { role: string; content: string }[]) => Promise<void>
      onModelProgress: (cb: (progress: { percentage: number; downloaded: number; total: number }) => void) => () => void
      onCompletionStream: (cb: (token: string) => void) => () => void
      unloadModel: () => Promise<string>
    }
  }
}
export {}
