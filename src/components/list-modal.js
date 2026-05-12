import { BaseModal } from "./modal-base.js";
import { buttonHtml } from "./ui/button.js";
import { i18n } from "../managers/i18n-manager.js";

/**
 * ListModal — displays a list of in-game items / collectibles.
 *
 * This is a template placeholder. Real games populate `#items` from
 * a manager or entity. The modal skeleton (title, empty state, close
 * button) is ready to use.
 */
export class ListModal extends BaseModal {
  get title() {
    return i18n.t("list.title");
  }

  renderBody() {
    /* Template placeholder: no items by default. */
    const items = [];

    if (items.length === 0) {
      return `<p class="gt-empty">${i18n.t("list.empty")}</p><div class="gt-modal-footer">${buttonHtml({ action: "close", label: i18n.t("menu.close"), variant: "ghost" })}</div>`;
    }

    const rows = items
      .map(
        (item) =>
          `<div class="gt-list-row"><span class="gt-list-label">${item.name ?? "—"}</span></div>`,
      )
      .join("");

    const footer = buttonHtml({
      action: "close",
      label: i18n.t("menu.close"),
      variant: "ghost",
    });

    return `<div class="gt-list">${rows}</div><div class="gt-modal-footer">${footer}</div>`;
  }
}
