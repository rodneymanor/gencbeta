import { ReactNode } from "react";

export interface TopBarConfig {
  title: ReactNode;
  description?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export const defaultTopBarConfig: TopBarConfig = {
  title: "",
  description: "",
  actions: null,
  isLoading: false,
};
