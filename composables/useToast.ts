const message = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

export function useToast() {
  function show(text: string, ms = 2200) {
    message.value = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message.value = null;
    }, ms);
  }

  return { toastMessage: message, showToast: show };
}
