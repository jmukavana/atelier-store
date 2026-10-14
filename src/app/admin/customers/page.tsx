import type { Metadata } from "next";
import { getAdminUsers } from "@/lib/admin-server";

export const metadata: Metadata = {
  title: "Customers — Admin",
};

export default async function AdminCustomersPage() {
  const { items, total } = await getAdminUsers({ limit: 100 });

  return (
    <div>
      <p className="label-tracked text-muted-foreground">People</p>
      <h1 className="mt-2 font-heading text-3xl italic">
        Customers ({total})
      </h1>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-tracked border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Joined</th>
              <th className="px-4 py-3 font-normal">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.isAdmin ? "Admin" : "Customer"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
