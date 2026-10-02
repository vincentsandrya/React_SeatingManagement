// components/TableReport.tsx
import { useEffect, useState } from "react";
import { guestService } from "../services/guestService";
import type { TableReportData } from "../types/report";

export const ReportGuestPage = () => {
  const [reportData, setReportData] = useState<TableReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await guestService.getTableReport();
        setReportData(data);
      } catch (error) {
        console.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading)
    return <div className="p-4 text-gray-500">Loading report...</div>;
  if (!reportData) return <div className="p-4">No data available.</div>;

  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full border-collapse border border-gray-200 text-sm text-left">
        <thead className="bg-gray-50">
          <tr>
            <th
              rowSpan={2}
              className="border border-gray-200 p-3 font-semibold text-gray-700 align-top"
            >
              Table Number
            </th>
            <th
              colSpan={3}
              className="border border-gray-200 p-3 font-semibold text-gray-700 text-center"
            >
              Invitation
            </th>
            <th
              colSpan={3}
              className="border border-gray-200 p-3 font-semibold text-gray-700 text-center"
            >
              Pax
            </th>
          </tr>
          <tr className="bg-white">
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Check-in
            </th>
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Pending
            </th>
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Total
            </th>
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Check-in
            </th>
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Pending
            </th>
            <th className="border border-gray-200 p-2 font-medium text-gray-600 text-center">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {reportData.items.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="border border-gray-200 p-3 font-medium text-gray-700">
                {row.table_number}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.invitation_check_in}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.invitation_pending}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.invitation_total}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.pax_check_in}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.pax_pending}
              </td>
              <td className="border border-gray-200 p-3 text-center">
                {row.pax_total}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 font-bold text-gray-800">
          <tr>
            <td className="border border-gray-200 p-3">Grand Total</td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.invitation_check_in}
            </td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.invitation_pending}
            </td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.invitation_total}
            </td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.pax_check_in}
            </td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.pax_pending}
            </td>
            <td className="border border-gray-200 p-3 text-center">
              {reportData.grandTotal.pax_total}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
