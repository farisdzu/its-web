import { useAuth } from "../../context/AuthContext";
import AvatarUpload from "./AvatarUpload";

export default function UserMetaCard() {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      user: 'User',
    };
    return roleMap[role] || role;
  };

  const displayName = user?.name || "User";
  const displayRole = user?.role ? getRoleDisplayName(user.role) : "";
  const displayEmployeeId = user?.employee_id || "";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <AvatarUpload size="md" showUploadMenu={true} />
          <div>
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {displayName}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              {displayRole && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {displayRole}
                  </p>
                  {displayEmployeeId && (
                    <>
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {displayEmployeeId}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

