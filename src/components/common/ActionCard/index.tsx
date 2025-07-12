/**
 * ActionCard Component
 * Centralized action button component for consistent UI patterns
 */

"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ActionButton {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface ActionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions: ActionButton[];
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  showCard?: boolean;
  compact?: boolean;
}

export function ActionCard({
  title,
  description,
  icon,
  actions,
  className,
  headerClassName,
  contentClassName,
  actionsClassName,
  showCard = true,
  compact = false,
}: ActionCardProps) {
  const content = (
    <div className={cn("space-y-4", contentClassName)}>
      {/* Header */}
      <div className={cn("flex items-start gap-3", headerClassName)}>
        {icon && (
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <div className="text-primary h-5 w-5">{icon}</div>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex gap-2",
        compact ? "flex-wrap" : "flex-col sm:flex-row",
        actionsClassName
      )}>
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            size={action.size || "sm"}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={cn(
              compact ? "flex-1" : "w-full sm:w-auto",
              action.className
            )}
          >
            {action.loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {action.icon && !action.loading && (
              <span className="mr-2">{action.icon}</span>
            )}
            {action.loading ? "Loading..." : action.label}
          </Button>
        ))}
      </div>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardContent className="p-4">
        {content}
      </CardContent>
    </Card>
  );
}

// Specialized ActionCard variants
export function CompactActionCard(props: Omit<ActionCardProps, "compact">) {
  return <ActionCard {...props} compact={true} />;
}

export function InlineActionCard(props: Omit<ActionCardProps, "showCard">) {
  return <ActionCard {...props} showCard={false} />;
}

// Action button group for horizontal layouts
export function ActionButtonGroup({
  actions,
  className,
  compact = false,
}: {
  actions: ActionButton[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      "flex gap-2",
      compact ? "flex-wrap" : "flex-col sm:flex-row",
      className
    )}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || "outline"}
          size={action.size || "sm"}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={cn(
            compact ? "flex-1" : "w-full sm:w-auto",
            action.className
          )}
        >
          {action.loading && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {action.icon && !action.loading && (
            <span className="mr-2">{action.icon}</span>
          )}
          {action.loading ? "Loading..." : action.label}
        </Button>
      ))}
    </div>
  );
} 