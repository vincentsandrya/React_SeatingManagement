export interface TableReportItem {
  table_number: string;
  invitation_check_in: number;
  invitation_pending: number;
  invitation_total: number;
  pax_check_in: number;
  pax_pending: number;
  pax_total: number;
}

export interface TableReportData {
  items: TableReportItem[];
  grandTotal: Omit<TableReportItem, "table_number">;
}
