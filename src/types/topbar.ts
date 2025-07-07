export type TopBarTitlePosition = "left" | "center" | "hidden";

export interface TopBarConfig {
  showTitle: boolean;
  titlePosition: TopBarTitlePosition;
  title?: string;
  customContent?: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export interface TopBarContextValue {
  config: TopBarConfig;
  setConfig: (config: Partial<TopBarConfig>) => void;
  resetConfig: () => void;
}

export const defaultTopBarConfig: TopBarConfig = {
  showTitle: true,
  titlePosition: "left",
  showBackButton: false,
  className: "",
};
