import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { APP_NAME } from "./configs/constants.js";
import { layout } from "./managers/layout-manager.js";
import { audioManager } from "./managers/audio-manager.js";
import { SceneRouter } from "./scenes/scene-router.js";
import { TitleScene } from "./scenes/title-scene.js";

/* Set the page title from the centralized constant. */
document.title = APP_NAME;

/* On Capacitor native (Android/iOS), `window.close()` is a no-op. Override it
   so any "Exit" button can properly terminate the app. */
if (Capacitor.isNativePlatform()) {
  window.close = () => App.exitApp();
}

const container = /** @type {HTMLElement} */ (
  document.getElementById("game-container")
);

/* Wire layout to the real viewport. CSS variables on :root flow down to every
   stylesheet — gameplay code just reads `layout.safe.*`. */
const onResize = () => layout.update(window.innerWidth, window.innerHeight);
onResize();
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/* Warm up the audio pool. Playback is gated until `audioManager.unlock()` is
   called on the first user gesture (TitleScene does this). */
audioManager.preload();

const router = new SceneRouter(container);
router.start(TitleScene);

/* Dev-only: install the safe-zone overlay + nav bar and provide a shortcut
   to the Styleguide scene. Both branches use dynamic imports so Vite strips
   them from production. */
if (import.meta.env.DEV) {
  import("./utils/dev-overlay.js").then(({ installDevOverlay }) => {
    const install = () =>
      installDevOverlay({
        onTitle: () => router.start(TitleScene),
        onStyleguide: async () => {
          const { StyleguideScene } = await import(
            "./scenes/styleguide-scene.js"
          );
          router.start(StyleguideScene);
        },
      });
    if (document.body) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
}

export { router };
