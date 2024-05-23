export {}

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      verify(): R
    }
  }
}
