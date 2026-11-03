const APP_SHELL_HIDE_MOBILE_PAGE_H1 = Symbol("APP_SHELL_HIDE_MOBILE_PAGE_H1");

export function provideAppShellChrome() {
  provide(APP_SHELL_HIDE_MOBILE_PAGE_H1, true);
}

export function useAppShellHideMobilePageH1(): boolean {
  return inject(APP_SHELL_HIDE_MOBILE_PAGE_H1, false);
}
