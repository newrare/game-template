import { BaseModal } from "./modal-base.js";
import { buttonHtml } from "./ui/button.js";
import { i18n } from "../managers/i18n-manager.js";
import { saveManager } from "../managers/save-manager.js";
import { MAX_SAVE_SLOTS } from "../configs/constants.js";

/**
 * SavesModal — save / load / delete game saves.
 *
 * Shows the auto-save slot (if any) + the fixed-size user-slot array.
 * Real games wire `onLoad` to restore state; this template provides
 * the full UI skeleton.
 */
export class SavesModal extends BaseModal {
  get title() {
    return i18n.t("saves.title");
  }

  renderBody() {
    const auto = saveManager.loadAuto();
    const slots = saveManager.getSlots();

    let html = "";

    /* Auto-save row */
    html += `<div class="gt-save-row">
      <span class="gt-save-label">${i18n.t("saves.autosave")}</span>
      <span class="gt-save-date">${auto ? new Date(auto.date).toLocaleString() : i18n.t("saves.no_autosave")}</span>
      <span class="gt-save-actions">
        ${auto ? `<button class="gt-btn gt-btn--secondary gt-btn--sm gt-clickable" data-action="load-auto">${i18n.t("saves.load")}</button>` : ""}
      </span>
    </div>`;

    /* User slots */
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const slot = slots[i];
      const label = i18n.t("saves.slot", { n: i + 1 });
      const dateStr = slot
        ? new Date(slot.date).toLocaleString()
        : i18n.t("saves.empty_slot");

      html += `<div class="gt-save-row">
        <span class="gt-save-label">${label}</span>
        <span class="gt-save-date">${dateStr}</span>
        <span class="gt-save-actions">
          ${slot ? `<button class="gt-btn gt-btn--secondary gt-btn--sm gt-clickable" data-action="load-slot" data-slot="${i}">${i18n.t("saves.load")}</button>` : ""}
          <button class="gt-btn gt-btn--secondary gt-btn--sm gt-clickable" data-action="save-slot" data-slot="${i}">${i18n.t("saves.save")}</button>
          ${slot ? `<button class="gt-btn gt-btn--danger gt-btn--sm gt-clickable" data-action="delete-slot" data-slot="${i}">${i18n.t("saves.delete")}</button>` : ""}
        </span>
      </div>`;
    }

    const footer = buttonHtml({
      action: "close",
      label: i18n.t("menu.close"),
      variant: "ghost",
    });

    return `<div class="gt-save-list">${html}</div><div class="gt-modal-footer">${footer}</div>`;
  }

  onAction(action, event) {
    const target = /** @type {HTMLElement} */ (event.target).closest(
      "[data-slot]",
    );
    const slot = target ? Number(target.dataset.slot) : -1;

    switch (action) {
      case "load-auto": {
        const data = saveManager.loadAuto();
        if (data) {
          /* Template placeholder — real games restore state here. */
          this.close();
        }
        break;
      }
      case "load-slot": {
        const data = saveManager.loadSlot(slot);
        if (data) {
          /* Template placeholder — real games restore state here. */
          this.close();
        }
        break;
      }
      case "save-slot": {
        const existing = saveManager.loadSlot(slot);
        if (existing && !window.confirm(i18n.t("saves.confirm_overwrite"))) {
          break;
        }
        /* Template placeholder — real games serialize state here. */
        saveManager.saveSlot(slot, { placeholder: true });
        this.refresh();
        break;
      }
      case "delete-slot": {
        if (!window.confirm(i18n.t("saves.confirm_delete"))) break;
        saveManager.clearSlot(slot);
        this.refresh();
        break;
      }
    }
  }
}
