import { audioManager } from "../managers/audio-manager.js";
import { i18n } from "../managers/i18n-manager.js";
import { APP_VERSION } from "../configs/constants.js";
import { ListenerBag } from "../utils/listener-bag.js";
import { SelectionScene } from "./selection-scene.js";

/**
 * Title scene — splash screen shown for 3 seconds. Displays the game logo
 * (top-center), and a dev credit section at the bottom with the Newrare
 * logo and version number. Unlocks audio on the first user gesture, then
 * auto-navigates to SelectionScene.
 */
export class TitleScene {
  /** @type {import('./scene-router.js').SceneRouter} */
  #router;

  /** @type {HTMLElement | null} */
  #el = null;

  /** @type {ListenerBag} */
  #bag = new ListenerBag();

  /** @type {boolean} */
  #transitioning = false;

  /** @param {import('./scene-router.js').SceneRouter} router */
  constructor(router) {
    this.#router = router;
  }

  /** @param {HTMLElement} root */
  mount(root) {
    this.#el = document.createElement("div");
    this.#el.className = "gt-title-scene";
    this.#el.innerHTML = this.#renderInner();
    root.appendChild(this.#el);

    /* Unlock audio on the first gesture (browser autoplay policy). */
    const unlockAudio = () => audioManager.unlock();
    this.#bag.on(window, "keydown", unlockAudio, { once: true });
    this.#bag.on(this.#el, "pointerdown", unlockAudio, { once: true });

    /* Auto-navigate after 3 seconds. */
    this.#bag.timeout(() => this.#navigate(), 3000);

    this.#bag.add(i18n.onChange(() => this.#refresh()));
  }

  #renderInner() {
    return `
      <div class="gt-title-top">
        <img src="images/newrare.png" alt="${i18n.t("app.name")}" class="gt-title-logo" />
      </div>
      <div class="gt-title-bottom">
        <img src="images/newrare.png" alt="Newrare" class="gt-title-newrare" />
        <div class="gt-title-credit">
          <p class="gt-title-dev">${i18n.t("title.dev_by")}</p>
          <p class="gt-title-version">v${APP_VERSION}</p>
        </div>
      </div>
    `;
  }

  #refresh() {
    if (!this.#el) return;
    const dev = this.#el.querySelector(".gt-title-dev");
    if (dev) dev.textContent = i18n.t("title.dev_by");
  }

  #navigate() {
    if (this.#transitioning) return;
    this.#transitioning = true;
    this.#router.start(SelectionScene);
  }

  destroy() {
    this.#bag.dispose();
    this.#el?.remove();
    this.#el = null;
  }
}
