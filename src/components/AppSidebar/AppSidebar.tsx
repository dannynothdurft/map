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
  { key: "tour", label: "Tour", icon: "🚗" },
  { key: "adressbuch", label: "Adressbuch", icon: "📖" },
  { key: "routen", label: "Routen", icon: "🏁" },
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
      {/* Always-visible icon rail - switching panels also opens the drawer
          via the existing onPanelChange handler in page.tsx. */}
      <nav className={styles.rail}>
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            type="button"
            className={`${styles.railButton} ${
              activePanel === panel.key ? styles.railButtonActive : ""
            }`}
            onClick={() => onPanelChange(panel.key)}
            title={panel.label}
            aria-label={panel.label}
          >
            <span aria-hidden="true">{panel.icon}</span>
          </button>
        ))}

        <button
          type="button"
          className={styles.railToggle}
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Menü einklappen" : "Menü öffnen"}
          title={isOpen ? "Einklappen" : "Menü öffnen"}
        >
          <span
            className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""}`}
            aria-hidden="true"
          >
            ›
          </span>
        </button>
      </nav>

      {isOpen && <div className={styles.backdrop} onClick={onToggleOpen} aria-hidden="true" />}

      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerContent}>{children}</div>

        <div className={styles.footer}>
          <span className={styles.footerCredit}>Created by Danny Nothdurft</span>
          <span className={styles.footerVersion}>v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
