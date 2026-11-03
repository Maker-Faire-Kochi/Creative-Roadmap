// Minimal vue for the website modules that import it outside a component (useCountdown.ts). Not reactive.
export const ref = value => ({ value })
export const computed = get => ({ get value() { return get() } })
export const onMounted = () => {}
export const onBeforeUnmount = () => {}
export const onUnmounted = () => {}
export const watch = () => () => {}
