import { GameController } from "../controllers/game-controller.js";
import { Hud } from "../components/hud.js";
import { Navbar } from "../components/navbar.js";

/**
 * GameScene — main gameplay scene. Stays thin on purpose: every piece of
 * gameplay logic lives in `GameController`. The scene owns the controller's
 * lifecycle and gives it a DOM root to attach to.
 *
 * If this file grows past ~150 lines, push the new behaviour into the
 * controller or a new manager instead.
 */
export class GameScene {
  /** @type {import('./scene-router.js').SceneRouter} */
  #router;

  /** @type {object} */
  #data;

  /** @type {GameController | null} */
  #controller = null;

  /** @type {Hud | null} */
  #hud = null;

  /** @type {Navbar | null} */
  #navbar = null;

  /**
   * @param {import('./scene-router.js').SceneRouter} router
   * @param {object} [data] — payload forwarded by `router.start`
   */
  constructor(router, data = {}) {
    this.#router = router;
    this.#data = data;
  }

  /** @param {HTMLElement} root */
  mount(root) {
    this.#controller = new GameController({
      root,
      router: this.#router,
      data: this.#data,
    });
    this.#controller.start();

    /* Navbar header */
    this.#navbar = new Navbar({ titleKey: "scene.game" });
    this.#navbar.mount(root);

    /* HUD navigation buttons */
    this.#hud = new Hud();
    this.#hud.mount(root);
  }

  destroy() {
    this.#hud?.destroy();
    this.#hud = null;
    this.#navbar?.destroy();
    this.#navbar = null;
    this.#controller?.destroy();
    this.#controller = null;
  }
}
