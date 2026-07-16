"use client";

import type { ReactNode } from "react";
import packageJson from "../../../package.json";
import styles from "./AppSidebar.module.scss";

const APP_VERSION = packageJson.version;

export type PanelKey = "tour" | "adressbuch" | "routen";

interface PanelDef {
  key: PanelKey;
  label: string;
  icon: string;
}

const PANELS: PanelDef[] = [
  { key: "tour", label: "Tour", icon: "🧭" },
  { key: "adressbuch", label: "Adressbuch", icon: "📖" },
  { key: "routen", label: "Routen", icon: "⭐" },
];

interface AppSidebarProps {
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  panelTitle: string;
  children: ReactNode;
}

export default function AppSidebar({
  activePanel,
  onPanelChange,
  isOpen,
  onToggleOpen,
  panelTitle,
  children,
}: AppSidebarProps) {
  return (
    <div className={styles.shell}>
      <nav className={styles.rail} aria-label="Bereiche">
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            type="button"
            className={`${styles.railButton} ${
              isOpen && activePanel === panel.key ? styles.railButtonActive : ""
            }`}
            onClick={() => onPanelChange(panel.key)}
            title={panel.label}
          >
            <span className={styles.railIcon} aria-hidden="true">
              {panel.icon}
            </span>
            <span className={styles.railLabel}>{panel.label}</span>
          </button>
        ))}

        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggleOpen}
          title={isOpen ? "Einklappen" : "Ausklappen"}
          aria-label={isOpen ? "Panel einklappen" : "Panel ausklappen"}
        >
          <span className={isOpen ? styles.chevronOpen : styles.chevronClosed} aria-hidden="true">
            ‹
          </span>
        </button>

        <span className={styles.version}>v{APP_VERSION}</span>
      </nav>

      {isOpen && <div className={styles.backdrop} onClick={onToggleOpen} aria-hidden="true" />}

      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <span>{panelTitle}</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onToggleOpen}
            aria-label="Panel schließen"
          >
            ✕
          </button>
        </div>
        <div className={styles.drawerContent}>{children}</div>
      </div>
    </div>
  );
}
