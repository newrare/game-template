import { ListenerBag } from "../utils/listener-bag.js";
import { i18n } from "../managers/i18n-manager.js";

/**
 * Navbar — persistent header bar inside the safe zone, visible on every
 * scene except TitleScene. Sits side-by-side with the menu-list HUD button.
 *
 * Built-in slots:
 *   - Left  : scene title (set via constructor `titleKey` i18n key or `setTitle()`)
 *   - Center: free slot for game stats, currency, etc.
 *   - Right : free slot for extra controls
 *
 * Usage:
 *   const navbar = new Navbar({ titleKey: 'scene.selection' });
 *   navbar.mount(root);
 *   navbar.setTitle('Custom title');  // override at any time
 *   navbar.setSlot('center', '<span>⚡ 3</span>');
 */
export class Navbar {
  /** @type {HTMLElement | null} */
  #el = null;

  /** @type {ListenerBag} */
  #bag = new ListenerBag();

  /** @type {string} */
  #title;

  /** @type {string | null} */
  #titleKey;

  /**
   * @param {{ title?: string, titleKey?: string }} [options]
   *   `titleKey` — i18n key that auto-updates on locale change.
   *   `title`    — static string, used as fallback when `titleKey` is absent.
   */
  constructor(options = {}) {
    this.#titleKey = options.titleKey ?? null;
    this.#title = this.#titleKey ? i18n.t(this.#titleKey) : (options.title ?? "");
  }

  /** @param {HTMLElement} parent */
  mount(parent) {
    this.#el = document.createElement("div");
    this.#el.className = "gt-navbar";
    this.#el.innerHTML = this.#render();
    parent.appendChild(this.#el);

    /* Auto-update title when locale changes if a titleKey was provided. */
    if (this.#titleKey) {
      this.#bag.add(
        i18n.onChange(() => this.setTitle(i18n.t(/** @type {string} */ (this.#titleKey)))),
      );
    }
  }

  /** Update the left-slot title text. */
  setTitle(title) {
    this.#title = title;
    const el = this.#el?.querySelector(".gt-navbar-title");
    if (el) {
      el.textContent = title;
    } else {
      const left = this.#el?.querySelector(".gt-navbar-left");
      if (left)
        left.innerHTML = `<span class="gt-navbar-title">${title}</span>`;
    }
  }

  /**
   * Replace the inner HTML of a named slot.
   * @param {'left' | 'center' | 'right'} slot
   * @param {string} html
   */
  setSlot(slot, html) {
    if (!this.#el) return;
    const el = this.#el.querySelector(`.gt-navbar-${slot}`);
    if (el) el.innerHTML = html;
  }

  /**
   * Replace a named slot with a DOM node.
   * @param {'left' | 'center' | 'right'} slot
   * @param {Node} node
   */
  setSlotNode(slot, node) {
    if (!this.#el) return;
    const el = this.#el.querySelector(`.gt-navbar-${slot}`);
    if (!el) return;
    el.innerHTML = "";
    el.appendChild(node);
  }

  /** @returns {HTMLElement | null} The navbar root element. */
  get root() {
    return this.#el;
  }

  destroy() {
    this.#bag.dispose();
    this.#el?.remove();
    this.#el = null;
  }

  // ─── Internals ──────────────────────────────────────

  #render() {
    const titleHtml = this.#title
      ? `<span class="gt-navbar-title">${this.#title}</span>`
      : "";
    return `
      <div class="gt-navbar-left">${titleHtml}</div>
      <div class="gt-navbar-center"></div>
      <div class="gt-navbar-right"></div>
    `;
  }
}
