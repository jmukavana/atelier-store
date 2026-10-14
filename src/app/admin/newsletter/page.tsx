import type { Metadata } from "next";
import { getAdminNewsletterSubscribers } from "@/lib/admin-server";

export const metadata: Metadata = {
  title: "Newsletter — Admin",
};

export default async function AdminNewsletterPage() {
  const subscribers = await getAdminNewsletterSubscribers();

  return (
    <div>
      <p className="label-tracked text-muted-foreground">Marketing</p>
      <h1 className="mt-2 font-heading text-3xl italic">
        Newsletter Subscribers ({subscribers.length})
      </h1>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-tracked border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="px-4 py-3">{subscriber.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(subscriber.createdAt).toLocaleDateString("en-US")}
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-10 text-center text-muted-foreground">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
