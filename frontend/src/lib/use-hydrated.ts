"use client"; // Readiness is determined by the browser's first hydrated React render.
import { useSyncExternalStore } from "react"; // Use React's server snapshot contract without effect-driven state updates.
const subscribe = () => () => {}; // Hydration is the only transition, so no external event subscription is needed.
const clientSnapshot = () => true; // React handlers are attached when the client snapshot becomes active.
const serverSnapshot = () => false; // Keep server-rendered controlled fields non-editable until their handlers exist.
export function useHydrated() { // Share the same server/client readiness contract across native controls.
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot); // Preserve identical server and initial hydration markup.
} // Finish the readiness hook.
