export async function updateAppBadge(count) {
  if (!('setAppBadge' in navigator)) return
  try {
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch {
    // Badge API not available or denied
  }
}
