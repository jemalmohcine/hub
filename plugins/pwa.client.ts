export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* optional offline shell */
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
});
