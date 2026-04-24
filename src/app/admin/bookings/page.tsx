import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  // Only pull leads that have been confirmed as booked
  const bookings = await prisma.lead.findMany({
    where: { status: "BOOKED" },
    orderBy: { preferredDate: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <span className="bg-green-900/40 text-green-300 text-xs font-medium px-3 py-1 rounded-full border border-green-800">
          {bookings.length} booked
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">No bookings yet.</p>
          <p className="text-gray-600 text-xs mt-2">
            Mark a lead as <span className="text-green-400">BOOKED</span> from
            the Leads page to see it here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Preferred Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-900">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="text-gray-300 hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{booking.fullName}</p>
                    <p className="text-gray-500 text-xs">{booking.email}</p>
                  </td>
                  <td className="px-4 py-3">{booking.phone}</td>
                  <td className="px-4 py-3">{booking.serviceRequested}</td>
                  <td className="px-4 py-3">{booking.preferredDate}</td>
                  <td className="px-4 py-3">{booking.preferredTime}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {booking.vehicleYear} {booking.vehicleMake}{" "}
                    {booking.vehicleModel}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
