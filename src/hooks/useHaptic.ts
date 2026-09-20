export function triggerHaptic(pattern: number | number[] = 15) {
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore haptic errors on unsupported devices
  }
}
