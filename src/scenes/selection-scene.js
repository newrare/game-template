import { ListenerBag } from "../utils/listener-bag.js";
import { i18n } from "../managers/i18n-manager.js";
import { Hud } from "../components/hud.js";
import { Navbar } from "../components/navbar.js";
import { buttonHtml } from "../components/ui/button.js";
import { GameScene } from "./game-scene.js";

/**
 * SelectionScene — landing scene after the title splash. Intentionally
 * minimal; the Navbar, HUD navigation buttons, and a Play button are
 * visible. Real games populate this scene with level-select, character-select,
 * or any pre-gameplay UI.
 */
export class SelectionScene {
  /** @type {import('./scene-router.js').SceneRouter} */
  #router;

  /** @type {HTMLElement | null} */
  #el = null;

  /** @type {ListenerBag} */
  #bag = new ListenerBag();

  /** @type {Hud | null} */
  #hud = null;

  /** @type {Navbar | null} */
  #navbar = null;

  /** @param {import('./scene-router.js').SceneRouter} router */
  constructor(router) {
    this.#router = router;
  }

  /** @param {HTMLElement} root */
  mount(root) {
    /* Navbar header */
    this.#navbar = new Navbar({ titleKey: "scene.selection" });
    this.#navbar.mount(root);
    this.#bag.add(() => this.#navbar?.destroy());

    /* Scene body — centered Play button */
    this.#el = document.createElement("div");
    this.#el.className = "gt-scene-center";
    this.#el.innerHTML = buttonHtml({ action: "play", label: i18n.t("menu.start") });
    root.appendChild(this.#el);
    this.#bag.on(this.#el, "pointerdown", this.#handleClick);
    this.#bag.add(i18n.onChange(() => {
      this.#el.innerHTML = buttonHtml({ action: "play", label: i18n.t("menu.start") });
    }));

    /* HUD navigation buttons */
    this.#hud = new Hud();
    this.#hud.mount(root);
    this.#bag.add(() => this.#hud?.destroy());
  }

  /** @param {PointerEvent} e */
  #handleClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (e.target).closest("[data-action]");
    if (/** @type {HTMLElement} */ (btn)?.dataset.action === "play") {
      this.#router.start(GameScene);
    }
  };

  destroy() {
    this.#bag.dispose();
    this.#hud = null;
    this.#navbar = null;
    this.#el?.remove();
    this.#el = null;
  }
}
