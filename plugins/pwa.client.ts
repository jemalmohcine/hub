export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  if (!("serviceWorker" in navigator)) return;

  const register = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js?v=7", { updateViaCache: "none" });
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      await reg.update();
    } catch {
      /* optional */
    }
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });

  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
});
