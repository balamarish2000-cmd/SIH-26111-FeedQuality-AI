"""Report chart helpers.

Static PNG figures for the training report. Palette follows the validated
reference instance from the dataviz skill (references/palette.md): a single
blue hue stepped light->dark for sequential/magnitude encodings, the fixed
8-slot categorical order for identity encodings, and the reserved
good/warning/serious/critical status colors for the quality_status grades
(Good/Moderate/Poor/Unsafe map naturally onto that scale). No default
matplotlib colormaps (viridis/tab10/jet) are used.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

# --- palette (from references/palette.md, reused verbatim) -----------------
SURFACE = "#fcfcfb"
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
BASELINE = "#c3c2b7"

SEQUENTIAL_BLUE_STEPS = [
    "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b",
]
SEQUENTIAL_BLUE_CMAP = LinearSegmentedColormap.from_list("seq_blue", SEQUENTIAL_BLUE_STEPS)

CATEGORICAL = {
    "blue": "#2a78d6",
    "orange": "#eb6834",
    "aqua": "#1baf7a",
    "yellow": "#eda100",
    "magenta": "#e87ba4",
    "green": "#008300",
    "violet": "#4a3aa7",
    "red": "#e34948",
}
CATEGORICAL_ORDER = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"]

STATUS = {
    "good": "#0ca30c",
    "warning": "#fab219",
    "serious": "#ec835a",
    "critical": "#d03b3b",
}
# quality_status grades map directly onto the reserved status scale.
QUALITY_STATUS_COLOR = {
    "Good": STATUS["good"],
    "Moderate": STATUS["warning"],
    "Poor": STATUS["serious"],
    "Unsafe": STATUS["critical"],
}

plt.rcParams.update(
    {
        "font.family": "sans-serif",
        "font.sans-serif": ["DejaVu Sans", "Arial", "Helvetica"],
        "text.color": INK_PRIMARY,
        "axes.edgecolor": BASELINE,
        "axes.labelcolor": INK_SECONDARY,
        "xtick.color": INK_MUTED,
        "ytick.color": INK_MUTED,
        "axes.facecolor": SURFACE,
        "figure.facecolor": SURFACE,
        "savefig.facecolor": SURFACE,
        "grid.color": GRIDLINE,
        "font.size": 10,
    }
)


def _class_color(label) -> str:
    if label in QUALITY_STATUS_COLOR:
        return QUALITY_STATUS_COLOR[label]
    return CATEGORICAL["blue"]


def plot_confusion_matrix(cm: np.ndarray, labels: list, title: str, out_path: Path) -> None:
    """Row-normalized confusion matrix (recall view) as a single-hue heatmap."""
    cm = np.asarray(cm, dtype=float)
    row_sums = cm.sum(axis=1, keepdims=True)
    norm = np.divide(cm, row_sums, out=np.zeros_like(cm), where=row_sums != 0)

    n = len(labels)
    fig, ax = plt.subplots(figsize=(1.15 * n + 2.2, 1.15 * n + 1.6), dpi=150)
    im = ax.imshow(norm, cmap=SEQUENTIAL_BLUE_CMAP, vmin=0, vmax=1, aspect="equal")

    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(labels, rotation=35, ha="right")
    ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(title, color=INK_PRIMARY, fontsize=12, fontweight="bold", pad=12)

    for spine in ax.spines.values():
        spine.set_visible(False)

    for i in range(n):
        for j in range(n):
            value = norm[i, j]
            count = int(cm[i, j])
            text_color = "#ffffff" if value > 0.55 else INK_PRIMARY
            ax.text(
                j, i, f"{value*100:.0f}%\n(n={count})",
                ha="center", va="center", fontsize=8.5, color=text_color,
            )

    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Share of actual class", color=INK_SECONDARY)
    cbar.outline.set_visible(False)

    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)


def plot_feature_importance(importances, title: str, out_path: Path, top_n: int = 15) -> None:
    top = importances.head(top_n).iloc[::-1]
    fig, ax = plt.subplots(figsize=(7.5, 0.38 * len(top) + 1.4), dpi=150)

    values = top.values
    vmax = values.max() if len(values) else 1.0
    colors = [SEQUENTIAL_BLUE_CMAP(0.35 + 0.6 * (v / vmax)) for v in values]
    value_fmt = "{:.0f}".format if vmax > 10 else "{:.3f}".format

    bars = ax.barh(range(len(top)), values, color=colors, height=0.62)
    ax.set_yticks(range(len(top)))
    ax.set_yticklabels(top.index)
    ax.set_xlabel("Importance")
    ax.set_title(title, color=INK_PRIMARY, fontsize=12, fontweight="bold", pad=12)
    ax.grid(axis="x", linewidth=0.8, alpha=0.6)
    ax.set_axisbelow(True)
    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)

    for bar, v in zip(bars, values):
        ax.text(
            bar.get_width() + vmax * 0.015, bar.get_y() + bar.get_height() / 2,
            value_fmt(v), va="center", ha="left", fontsize=8.5, color=INK_SECONDARY,
        )

    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)


def plot_model_comparison(results: dict, title: str, out_path: Path) -> None:
    """results: {target_name: {model_name: macro_f1}}"""
    targets = list(results.keys())
    model_names = list(next(iter(results.values())).keys())
    n_models = len(model_names)

    fig, ax = plt.subplots(figsize=(2.6 * len(targets) + 2, 5), dpi=150)
    x = np.arange(len(targets))
    width = 0.8 / n_models

    for i, model in enumerate(model_names):
        color = CATEGORICAL[CATEGORICAL_ORDER[i % len(CATEGORICAL_ORDER)]]
        values = [results[t][model] for t in targets]
        offset = (i - (n_models - 1) / 2) * width
        bars = ax.bar(x + offset, values, width=width * 0.92, color=color, label=model)
        for bar, v in zip(bars, values):
            ax.text(
                bar.get_x() + bar.get_width() / 2, v + 0.015, f"{v:.2f}",
                ha="center", va="bottom", fontsize=7.5, color=INK_SECONDARY, rotation=0,
            )

    ax.set_xticks(x)
    ax.set_xticklabels(targets)
    ax.set_ylabel("Validation macro-F1")
    ax.set_ylim(0, 1.08)
    ax.set_title(title, color=INK_PRIMARY, fontsize=12, fontweight="bold", pad=12)
    ax.grid(axis="y", linewidth=0.8, alpha=0.6)
    ax.set_axisbelow(True)
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)
    ax.spines["left"].set_color(BASELINE)
    ax.legend(frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=n_models)

    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)


def plot_class_distribution(y, title: str, out_path: Path, order: list | None = None) -> None:
    counts = y.value_counts()
    if order is not None:
        counts = counts.reindex([c for c in order if c in counts.index])
    labels = list(counts.index)
    values = counts.values
    colors = [_class_color(l) for l in labels]

    fig, ax = plt.subplots(figsize=(1.1 * len(labels) + 2, 4.2), dpi=150)
    bars = ax.bar(labels, values, color=colors, width=0.6)
    total = values.sum()
    for bar, v in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2, v + total * 0.01, f"{v}\n({v/total*100:.1f}%)",
            ha="center", va="bottom", fontsize=8.5, color=INK_SECONDARY,
        )
    ax.set_ylabel("Sample count")
    ax.set_title(title, color=INK_PRIMARY, fontsize=12, fontweight="bold", pad=12)
    ax.grid(axis="y", linewidth=0.8, alpha=0.6)
    ax.set_axisbelow(True)
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)
    ax.spines["left"].set_color(BASELINE)
    ax.set_ylim(0, values.max() * 1.18)

    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
