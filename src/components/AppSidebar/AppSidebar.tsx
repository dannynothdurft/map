"use client";

import type { ReactNode } from "react";
import packageJson from "../../../package.json";
import styles from "./AppSidebar.module.scss";

const APP_VERSION = packageJson.version;

export type PanelKey = "tour" | "adressbuch" | "routen" | "team";

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

const ADMIN_PANEL: PanelDef = { key: "team", label: "Team", icon: "👥" };

interface AppSidebarProps {
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  children: ReactNode;
  userName?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function AppSidebar({
  activePanel,
  onPanelChange,
  isOpen,
  onToggleOpen,
  children,
  userName,
  isAdmin,
  onLogout,
}: AppSidebarProps) {
  const panels = isAdmin ? [...PANELS, ADMIN_PANEL] : PANELS;

  return (
    <div className={styles.shell}>
      {/* Always-visible icon rail - switching panels also opens the drawer
          via the existing onPanelChange handler in page.tsx. */}
      <nav className={styles.rail}>
        {panels.map((panel) => (
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
          {userName && (
            <div className={styles.footerUser}>
              <span className={styles.footerUserName}>Angemeldet als {userName}</span>
              <button type="button" className={styles.footerLogout} onClick={onLogout}>
                Abmelden
              </button>
            </div>
          )}
          <span className={styles.footerCredit}>Created by Danny Nothdurft</span>
          <span className={styles.footerVersion}>v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
