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
  children: ReactNode;
}

export default function AppSidebar({
  activePanel,
  onPanelChange,
  isOpen,
  onToggleOpen,
  children,
}: AppSidebarProps) {
  return (
    <div className={styles.shell}>
      {!isOpen && (
        <button
          type="button"
          className={styles.openHandle}
          onClick={onToggleOpen}
          aria-label="Menü öffnen"
          title="Menü öffnen"
        >
          ›
        </button>
      )}

      {isOpen && <div className={styles.backdrop} onClick={onToggleOpen} aria-hidden="true" />}

      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.tabs}>
          {PANELS.map((panel) => (
            <button
              key={panel.key}
              type="button"
              className={`${styles.tabButton} ${
                activePanel === panel.key ? styles.tabButtonActive : ""
              }`}
              onClick={() => onPanelChange(panel.key)}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {panel.icon}
              </span>
              <span className={styles.tabLabel}>{panel.label}</span>
            </button>
          ))}

          <button
            type="button"
            className={styles.closeHandle}
            onClick={onToggleOpen}
            aria-label="Menü einklappen"
            title="Einklappen"
          >
            ‹
          </button>
        </div>

        <div className={styles.drawerContent}>{children}</div>

        <div className={styles.version}>v{APP_VERSION}</div>
      </div>
    </div>
  );
}
