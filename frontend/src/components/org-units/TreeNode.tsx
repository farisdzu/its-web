import { useState, memo } from "react";
import { OrgUnitTreeNode } from "../../services/api";
import Button from "../ui/button/Button";
import { Card } from "../ui/card";
import { ExpandButton } from "../ui/tree";
import { StatusIndicator } from "../ui/status";
import Badge from "../ui/badge/Badge";
import { LockIcon } from "../../icons";

interface TreeNodeProps {
  node: OrgUnitTreeNode;
  level: number;
  onCreate: (parentId: number | null) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (id: number, name: string) => void;
  onManageUsers: (orgUnitId: number, orgUnitName: string) => void;
  isLocked: boolean;
  isLast?: boolean;
  parentPath?: boolean[];
}

export const TreeNode = memo(function TreeNode({
  node,
  level,
  onCreate,
  onEdit,
  onDelete,
  onManageUsers,
  isLocked,
  isLast = false,
  parentPath = [],
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const indentSize = 16; // Base mobile size

  return (
    <div className="relative">
      <div className="relative flex items-start">
        {/* Expand/Collapse Button */}
        <ExpandButton
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          hasChildren={hasChildren}
          level={level}
          indentSize={indentSize}
        />

        {/* Content Card */}
        <Card padding="sm" hover={!isLocked} className={`flex-1 ml-1 ${isLocked ? "opacity-75" : ""}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              {/* Lock Indicator */}
              {isLocked && (
                <div title="Struktur terkunci">
                  <LockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              )}
              {/* Status Indicator */}
              <StatusIndicator
                status={node.is_active ? "active" : "inactive"}
                size="sm"
              />

              {/* Unit Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                    {node.name}
                  </div>
                  {level > 0 && (
                    <Badge variant="light" color="light" size="sm">
                      L{level + 1}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {node.type || "Bagian"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">·</span>
                  {node.parent_ids && node.parent_ids.length > 1 && (
                    <>
                      <div title={`Memiliki ${node.parent_ids.length} atasan`}>
                        <Badge variant="light" color="warning" size="sm">
                          {node.parent_ids.length} Atasan
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">·</span>
                    </>
                  )}
                  {node.user_count !== undefined && node.user_count > 0 && (
                    <>
                      <Badge variant="light" color="info" size="sm">
                        {node.user_count} User
                      </Badge>
                      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">·</span>
                    </>
                  )}
                  <Badge
                    variant="light"
                    color={node.is_active ? "success" : "light"}
                    size="sm"
                  >
                    {node.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap"
              style={{ position: "relative", zIndex: 10 }}
            >
              <div title={isLocked ? "Buka kunci struktur terlebih dahulu" : undefined}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onManageUsers(node.id, node.name)}
                  type="button"
                  disabled={isLocked}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Kelola User</span>
                  <span className="sm:hidden">User</span>
                </Button>
              </div>
              <div title={isLocked ? "Buka kunci struktur terlebih dahulu" : undefined}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreate(node.id)}
                  type="button"
                  disabled={isLocked}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">+ Child</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
              <div title={isLocked ? "Buka kunci struktur terlebih dahulu" : undefined}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(node)}
                  type="button"
                  disabled={isLocked}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Edit
                </Button>
              </div>
              <div title={isLocked ? "Buka kunci struktur terlebih dahulu" : undefined}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(node.id, node.name)}
                  type="button"
                  disabled={isLocked}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Children */}
      {hasChildren && (
        <div
          className="relative overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: isExpanded ? '0.5rem' : '0',
          }}
        >
          <div
            className="overflow-hidden min-h-0"
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: isExpanded ? '0.05s' : '0s',
            }}
          >
            <div className="space-y-1 sm:space-y-1.5">
              {node.children.map((child, index) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onCreate={onCreate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageUsers={onManageUsers}
                  isLocked={isLocked}
                  isLast={index === node.children!.length - 1}
                  parentPath={[...parentPath, !isLast]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

