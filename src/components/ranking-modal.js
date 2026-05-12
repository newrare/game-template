import { BaseModal } from "./modal-base.js";
import { buttonHtml } from "./ui/button.js";
import { i18n } from "../managers/i18n-manager.js";
import { saveManager } from "../managers/save-manager.js";

/**
 * RankingModal — displays a top-N leaderboard for the default game mode.
 * The template uses a single "default" mode; real games should customise.
 */
export class RankingModal extends BaseModal {
  /** @type {string} */
  #mode = "default";

  get title() {
    return i18n.t("ranking.title");
  }

  renderBody() {
    const rankings = saveManager.getRankings(this.#mode);

    if (rankings.length === 0) {
      return `<p class="gt-empty">${i18n.t("ranking.empty")}</p>`;
    }

    const header = `
      <div class="gt-ranking-row gt-ranking-header">
        <span class="gt-ranking-cell gt-ranking-rank">${i18n.t("ranking.rank")}</span>
        <span class="gt-ranking-cell gt-ranking-score">${i18n.t("ranking.score")}</span>
        <span class="gt-ranking-cell gt-ranking-date">${i18n.t("ranking.date")}</span>
      </div>`;

    const rows = rankings
      .map(
        (entry, idx) => `
      <div class="gt-ranking-row">
        <span class="gt-ranking-cell gt-ranking-rank">${idx + 1}</span>
        <span class="gt-ranking-cell gt-ranking-score">${entry.score ?? "—"}</span>
        <span class="gt-ranking-cell gt-ranking-date">${entry.date ? new Date(entry.date).toLocaleDateString() : "—"}</span>
      </div>`,
      )
      .join("");

    const footer = buttonHtml({
      action: "close",
      label: i18n.t("menu.close"),
      variant: "ghost",
    });

    return `<div class="gt-ranking-table">${header}${rows}</div><div class="gt-modal-footer">${footer}</div>`;
  }
}
