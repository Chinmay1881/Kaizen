import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True once hydrated on the client, false during SSR/first paint — for components that must
 * defer `createPortal` until `document.body` exists. Uses `useSyncExternalStore` (React's
 * blessed "read external state" primitive) instead of `useEffect(() => setState(true), [])`,
 * which the `react-hooks/set-state-in-effect` rule flags as an unnecessary cascading render. */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
