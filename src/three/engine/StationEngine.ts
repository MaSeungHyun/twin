/** M3에서 WebGL·매니저 구현. M1~M2는 dispose 가드만 제공. */
export class StationEngine {
  disposed = false

  constructor(_container: HTMLElement) {}

  start(): void {}

  stop(): void {}

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stop()
  }
}
