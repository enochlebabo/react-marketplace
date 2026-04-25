import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  useAdminAllListings,
  useAdminReports,
  useAdminUsers,
  useIsAdmin,
} from "../hooks/useQueries";
import { AdminListingRow } from "./AdminListingRow";
import { AdminRatingsPanel } from "./AdminRatingsPanel";
import { AdminReportRow } from "./AdminReportRow";
import { AdminUserRow } from "./AdminUserRow";

export function AdminDashboard() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const {
    data: reports,
    isLoading: reportsLoading,
    isError: reportsError,
  } = useAdminReports();
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useAdminUsers();
  const {
    data: allListings,
    isLoading: listingsLoading,
    isError: listingsError,
  } = useAdminAllListings();

  if (isAdminLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have admin permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">
            Reports{reports && reports.length > 0 ? ` (${reports.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="users">
            Users{users ? ` (${users.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="listings">
            Listings{allListings ? ` (${allListings.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-3 mt-4">
          {reportsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {reportsError && (
            <p className="text-sm text-destructive">Failed to load reports.</p>
          )}
          {reports && reports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending reports.
            </p>
          )}
          {reports?.map((report) => (
            <AdminReportRow key={report.id.toString()} report={report} />
          ))}
        </TabsContent>

        <TabsContent value="ratings" className="mt-4">
          <AdminRatingsPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-2 mt-4">
          {usersLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {usersError && (
            <p className="text-sm text-destructive">Failed to load users.</p>
          )}
          {users && users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found.
            </p>
          )}
          {users?.map((user) => (
            <AdminUserRow key={user.principal.toString()} user={user} />
          ))}
        </TabsContent>

        <TabsContent value="listings" className="space-y-2 mt-4">
          {listingsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {listingsError && (
            <p className="text-sm text-destructive">Failed to load listings.</p>
          )}
          {allListings && allListings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No listings found.
            </p>
          )}
          {allListings?.map((listing) => (
            <AdminListingRow key={listing.id.toString()} listing={listing} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
