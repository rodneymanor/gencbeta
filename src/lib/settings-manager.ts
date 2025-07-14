import { AdvancedHighlightSettings } from "@/app/(main)/dashboard/scripts/editor/_components/layout/advanced-highlight-controls";
import { EditorSettings } from "@/app/(main)/dashboard/scripts/editor/_components/layout/settings-panel";
import { UIPreferences } from "@/app/(main)/dashboard/scripts/editor/_components/layout/ui-preferences-panel";
import { ElementDetectionSettings } from "@/lib/enhanced-element-detection";
import { ReadabilitySettings } from "@/lib/enhanced-readability-service";

export interface HemingwayEditorSettings {
  version: string;
  lastModified: string;
  editor: EditorSettings;
  highlights: AdvancedHighlightSettings;
  ui: UIPreferences;
  readability: ReadabilitySettings;
  elementDetection: ElementDetectionSettings;
  metadata: {
    exportedBy: string;
    exportedAt: string;
    deviceInfo: string;
    browserInfo: string;
  };
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  migratedSettings?: HemingwayEditorSettings;
}

class SettingsManager {
  private readonly STORAGE_KEY = "hemingway-editor-settings";
  private readonly SETTINGS_VERSION = "1.0.0";
  private readonly BACKUP_KEY = "hemingway-editor-settings-backup";

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    // Create backup of existing settings on first load
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(this.STORAGE_KEY);
      if (existing && !localStorage.getItem(this.BACKUP_KEY)) {
        localStorage.setItem(this.BACKUP_KEY, existing);
      }
    }
  }

  // Save settings to localStorage
  saveSettings(settings: HemingwayEditorSettings): boolean {
    try {
      if (typeof window === "undefined") return false;

      const settingsWithMetadata = {
        ...settings,
        version: this.SETTINGS_VERSION,
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settingsWithMetadata));
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  }

  // Load settings from localStorage
  loadSettings(): HemingwayEditorSettings | null {
    try {
      if (typeof window === "undefined") return null;

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const settings = JSON.parse(stored) as HemingwayEditorSettings;
      const validation = this.validateSettings(settings);

      if (!validation.isValid) {
        console.warn("Settings validation failed:", validation.errors);
        return validation.migratedSettings || null;
      }

      return settings;
    } catch (error) {
      console.error("Failed to load settings:", error);
      return null;
    }
  }

  // Export settings to JSON file
  exportSettings(settings: HemingwayEditorSettings): void {
    try {
      const exportData = {
        ...settings,
        version: this.SETTINGS_VERSION,
        metadata: {
          exportedBy: "Hemingway Script Editor",
          exportedAt: new Date().toISOString(),
          deviceInfo: this.getDeviceInfo(),
          browserInfo: this.getBrowserInfo(),
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `hemingway-editor-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export settings:", error);
      throw new Error("Failed to export settings");
    }
  }

  // Import settings from JSON file
  async importSettings(file: File): Promise<HemingwayEditorSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string) as HemingwayEditorSettings;
          const validation = this.validateSettings(importedData);

          if (!validation.isValid) {
            if (validation.migratedSettings) {
              resolve(validation.migratedSettings);
            } else {
              reject(new Error(`Invalid settings file: ${validation.errors.join(", ")}`));
            }
            return;
          }

          resolve(importedData);
        } catch (error) {
          reject(new Error("Failed to parse settings file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read settings file"));
      };

      reader.readAsText(file);
    });
  }

  // Validate settings structure and migrate if necessary
  validateSettings(settings: any): SettingsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required top-level properties
    if (!settings || typeof settings !== "object") {
      errors.push("Settings must be an object");
      return { isValid: false, errors, warnings };
    }

    // Version compatibility check
    if (!settings.version) {
      warnings.push("Settings version not specified, attempting migration");
    } else if (settings.version !== this.SETTINGS_VERSION) {
      warnings.push(`Settings version ${settings.version} differs from current ${this.SETTINGS_VERSION}`);
    }

    // Validate editor settings
    if (!this.validateEditorSettings(settings.editor)) {
      errors.push("Invalid editor settings");
    }

    // Validate highlight settings
    if (!this.validateHighlightSettings(settings.highlights)) {
      errors.push("Invalid highlight settings");
    }

    // Validate UI preferences
    if (!this.validateUIPreferences(settings.ui)) {
      errors.push("Invalid UI preferences");
    }

    // Validate readability settings
    if (!this.validateReadabilitySettings(settings.readability)) {
      errors.push("Invalid readability settings");
    }

    // Validate element detection settings
    if (!this.validateElementDetectionSettings(settings.elementDetection)) {
      errors.push("Invalid element detection settings");
    }

    // Attempt migration if there are warnings but no errors
    if (errors.length === 0 && warnings.length > 0) {
      const migratedSettings = this.migrateSettings(settings);
      return {
        isValid: true,
        errors,
        warnings,
        migratedSettings,
      };
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Create backup of current settings
  createBackup(): boolean {
    try {
      if (typeof window === "undefined") return false;

      const current = localStorage.getItem(this.STORAGE_KEY);
      if (!current) return false;

      const backupKey = `${this.BACKUP_KEY}-${Date.now()}`;
      localStorage.setItem(backupKey, current);

      // Clean up old backups (keep only last 5)
      this.cleanupBackups();

      return true;
    } catch (error) {
      console.error("Failed to create backup:", error);
      return false;
    }
  }

  // Restore from backup
  restoreFromBackup(backupKey?: string): boolean {
    try {
      if (typeof window === "undefined") return false;

      const key = backupKey || this.BACKUP_KEY;
      const backup = localStorage.getItem(key);

      if (!backup) return false;

      localStorage.setItem(this.STORAGE_KEY, backup);
      return true;
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      return false;
    }
  }

  // Get list of available backups
  getBackups(): Array<{ key: string; date: string; size: number }> {
    if (typeof window === "undefined") return [];

    const backups: Array<{ key: string; date: string; size: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.BACKUP_KEY)) {
        const value = localStorage.getItem(key);
        if (value) {
          const timestamp = key.split("-").pop();
          const date = timestamp ? new Date(parseInt(timestamp)).toISOString() : "Unknown";
          backups.push({
            key,
            date,
            size: value.length,
          });
        }
      }
    }

    return backups.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Reset to default settings
  resetToDefaults(): boolean {
    try {
      if (typeof window === "undefined") return false;

      this.createBackup();
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Failed to reset settings:", error);
      return false;
    }
  }

  // Get storage usage info
  getStorageInfo(): { used: number; total: number; percentage: number } {
    if (typeof window === "undefined") {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      const settings = localStorage.getItem(this.STORAGE_KEY);
      const used = settings ? settings.length : 0;

      // Estimate total localStorage capacity (usually ~5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  private validateEditorSettings(settings: any): boolean {
    if (!settings || typeof settings !== "object") return false;

    const required = ["highlighting", "scriptElements", "readability", "ui", "advanced"];
    return required.every((key) => settings.hasOwnProperty(key));
  }

  private validateHighlightSettings(settings: any): boolean {
    if (!settings || typeof settings !== "object") return false;

    const required = ["hooks", "bridges", "goldenNuggets", "ctas", "readability"];
    return required.every((key) => typeof settings[key] === "boolean");
  }

  private validateUIPreferences(settings: any): boolean {
    if (!settings || typeof settings !== "object") return false;

    const required = ["theme", "typography", "layout", "editor", "accessibility", "performance"];
    return required.every((key) => settings.hasOwnProperty(key));
  }

  private validateReadabilitySettings(settings: any): boolean {
    if (!settings || typeof settings !== "object") return false;

    const required = ["algorithm", "thresholds", "enabledChecks", "customWeights"];
    return required.every((key) => settings.hasOwnProperty(key));
  }

  private validateElementDetectionSettings(settings: any): boolean {
    if (!settings || typeof settings !== "object") return false;

    const required = ["hooks", "bridges", "goldenNuggets", "ctas"];
    return required.every((key) => settings.hasOwnProperty(key));
  }

  private migrateSettings(settings: any): HemingwayEditorSettings {
    // Implement migration logic for different versions
    const migrated = {
      ...settings,
      version: this.SETTINGS_VERSION,
      lastModified: new Date().toISOString(),
    };

    // Add any missing properties with defaults
    if (!migrated.metadata) {
      migrated.metadata = {
        exportedBy: "Hemingway Script Editor",
        exportedAt: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
        browserInfo: this.getBrowserInfo(),
      };
    }

    return migrated;
  }

  private cleanupBackups(): void {
    if (typeof window === "undefined") return;

    const backups = this.getBackups();

    // Keep only the 5 most recent backups
    if (backups.length > 5) {
      const toDelete = backups.slice(5);
      toDelete.forEach((backup) => {
        localStorage.removeItem(backup.key);
      });
    }
  }

  private getDeviceInfo(): string {
    if (typeof window === "undefined") return "Server";

    const ua = navigator.userAgent;
    const platform = navigator.platform;
    return `${platform} - ${ua.substring(0, 50)}...`;
  }

  private getBrowserInfo(): string {
    if (typeof window === "undefined") return "Server";

    const ua = navigator.userAgent;
    let browser = "Unknown";

    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    return `${browser} - ${navigator.language}`;
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();

// Utility functions for common operations
export const exportEditorSettings = (settings: HemingwayEditorSettings) => {
  settingsManager.exportSettings(settings);
};

export const importEditorSettings = async (file: File): Promise<HemingwayEditorSettings> => {
  return settingsManager.importSettings(file);
};

export const saveEditorSettings = (settings: HemingwayEditorSettings): boolean => {
  return settingsManager.saveSettings(settings);
};

export const loadEditorSettings = (): HemingwayEditorSettings | null => {
  return settingsManager.loadSettings();
};

export const resetEditorSettings = (): boolean => {
  return settingsManager.resetToDefaults();
};

export const createSettingsBackup = (): boolean => {
  return settingsManager.createBackup();
};

export const getSettingsBackups = () => {
  return settingsManager.getBackups();
};

export const restoreSettingsBackup = (backupKey?: string): boolean => {
  return settingsManager.restoreFromBackup(backupKey);
};

export const getSettingsStorageInfo = () => {
  return settingsManager.getStorageInfo();
};
