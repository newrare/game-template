import { ListenerBag } from "../utils/listener-bag.js";
import { i18n } from "../managers/i18n-manager.js";
import { ListModal } from "./list-modal.js";
import { OptionsModal } from "./options-modal.js";
import { RankingModal } from "./ranking-modal.js";
import { SavesModal } from "./saves-modal.js";

/**
 * HUD — persistent navigation buttons displayed inside the safe zone.
 *
 * Layout:
 *   - top-right:    menu-list (collection / items) — aligned with the navbar
 *   - bottom-left:  menu-ranking (leaderboard)
 *   - bottom-right: menu-folder (saves) + menu-setting (options)
 *
 * Mounted on the scene root so it lives within the safe-zone container.
 * The HUD is intentionally **not** shown on TitleScene.
 */
export class Hud {
  /** @type {HTMLElement | null} */
  #el = null;

  /** @type {ListenerBag} */
  #bag = new ListenerBag();

  /** @type {import('./modal-base.js').BaseModal | null} */
  #activeModal = null;

  /** @param {HTMLElement} parent */
  mount(parent) {
    this.#el = document.createElement("div");
    this.#el.className = "gt-hud";
    this.#el.innerHTML = this.#render();
    parent.appendChild(this.#el);

    this.#bag.on(this.#el, "pointerdown", this.#handleClick);
    this.#bag.add(i18n.onChange(() => this.#refresh()));
  }

  destroy() {
    this.#activeModal?.destroy();
    this.#activeModal = null;
    this.#bag.dispose();
    this.#el?.remove();
    this.#el = null;
  }

  #render() {
    return `
      <div class="gt-hud-top-right">
        <button class="gt-hud-btn gt-clickable" data-hud="list" aria-label="${i18n.t("hud.list")}">
          <img src="images/menu-list.svg" alt="" class="gt-hud-icon" />
        </button>
      </div>
      <div class="gt-hud-bottom-left">
        <button class="gt-hud-btn gt-clickable" data-hud="ranking" aria-label="${i18n.t("hud.ranking")}">
          <img src="images/menu-ranking.svg" alt="" class="gt-hud-icon" />
        </button>
      </div>
      <div class="gt-hud-bottom-right">
        <button class="gt-hud-btn gt-clickable" data-hud="saves" aria-label="${i18n.t("hud.saves")}">
          <img src="images/menu-folder.svg" alt="" class="gt-hud-icon" />
        </button>
        <button class="gt-hud-btn gt-clickable" data-hud="settings" aria-label="${i18n.t("hud.settings")}">
          <img src="images/menu-setting.svg" alt="" class="gt-hud-icon" />
        </button>
      </div>
    `;
  }

  #refresh() {
    if (!this.#el) return;
    this.#el.innerHTML = this.#render();
  }

  /** @param {PointerEvent} e */
  #handleClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (e.target).closest(
      "[data-hud]",
    );
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    const action = /** @type {HTMLElement} */ (btn).dataset.hud;
    this.#openModal(action);
  };

  /** @param {string} name */
  #openModal(name) {
    if (this.#activeModal) {
      this.#activeModal.destroy();
      this.#activeModal = null;
    }

    const onClose = () => {
      this.#activeModal = null;
    };

    switch (name) {
      case "list":
        this.#activeModal = new ListModal({ onClose });
        break;
      case "settings":
        this.#activeModal = new OptionsModal({ onClose });
        break;
      case "ranking":
        this.#activeModal = new RankingModal({ onClose });
        break;
      case "saves":
        this.#activeModal = new SavesModal({ onClose });
        break;
      default:
        return;
    }
    this.#activeModal.open();
  }
}
