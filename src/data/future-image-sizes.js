// Matches the existing card border, section padding, image caps and 520/768/1024px breakpoints.
// No layout rules are changed: these values only guide the browser's source selection.
export const futureImageSizes = {
  'remote-center': '(max-width: 767px) min(calc(76vw - 38px), 384px), (max-width: 1023px) min(calc(48vw - 47.04px), 560px), min(calc(48vw - 62.4px), 560px)',
  'hazard-left': '(max-width: 519px) min(calc(76vw - 74.48px), 272px), (max-width: 767px) min(calc(50vw - 59px), 256px), (max-width: 1023px) min(calc(40vw - 39.2px), 480px), min(calc(40vw - 52px), 480px)',
  'hazard-right': '(max-width: 519px) min(calc(76vw - 74.48px), 272px), (max-width: 767px) min(calc(50vw - 59px), 272px), (max-width: 1023px) min(calc(41vw - 40.18px), 488px), min(calc(41vw - 53.3px), 488px)',
  'presence-left': '(max-width: 767px) min(calc(58vw - 29px), 296px), (max-width: 1023px) min(calc(41vw - 40.18px), 480px), min(calc(41vw - 53.3px), 480px)',
  'presence-right': '(max-width: 767px) min(calc(65vw - 32.5px), 328px), (max-width: 1023px) min(calc(43vw - 42.14px), 504px), min(calc(43vw - 55.9px), 504px)'
};
