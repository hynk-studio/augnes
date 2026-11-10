export class LiveNativeHostRunServiceErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 400) {
    super(code);
    this.name = "LiveNativeHostRunServiceErrorV01";
  }
}
