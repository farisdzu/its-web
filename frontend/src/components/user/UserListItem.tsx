import { FC, memo } from "react";
import { Card } from "../ui/card";
import Button from "../ui/button/Button";
import { SpinnerIcon } from "../ui/loading";
import { UserListItem as UserListItemType } from "../../services/api";

export interface UserListItemProps {
  user: UserListItemType;
  onAction: (userId: number) => void | Promise<void>;
  actionLabel: string;
  actionVariant?: "primary" | "outline";
  isLoading?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
  showOrgUnit?: boolean;
  showTitle?: boolean;
}

/**
 * Reusable component for displaying a user in a list
 * Optimized with React.memo for performance
 */
const UserListItem: FC<UserListItemProps> = memo(({
  user,
  onAction,
  actionLabel,
  actionVariant = "outline",
  isLoading = false,
  isDisabled = false,
  disabledTooltip,
  showOrgUnit = false,
  showTitle = true,
}) => {
  return (
    <Card padding="sm" className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
          {user.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {user.email}
          {showTitle && user.title && ` · ${user.title}`}
          {showOrgUnit && user.org_unit_name && (
            <span className="text-warning-600 dark:text-warning-500">
              {" · Sudah di: "}{user.org_unit_name}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0" title={isDisabled ? disabledTooltip : undefined}>
        <Button
          size="sm"
          variant={actionVariant}
          onClick={() => onAction(user.id)}
          type="button"
          disabled={isDisabled || isLoading}
          className="text-xs"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <SpinnerIcon size="sm" />
              <span className="hidden sm:inline">...</span>
            </span>
          ) : (
            actionLabel
          )}
        </Button>
      </div>
    </Card>
  );
});

UserListItem.displayName = "UserListItem";

export default UserListItem;

