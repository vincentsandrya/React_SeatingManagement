export interface GuestH {
  guest_h_id: string;
  ticket_code: string;
  category: string;
  title: string;
  name: string;
  checked_in_at: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface GuestD {
  guest_d_id: string;
  guest_h_id: string;
  title: string;
  name: string;
  table_number: string;
  seat_number: string;
  is_vegetarian: boolean;
  is_absent: boolean;
  checked_in_at: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface GuestView {
  guest_h_id: string;
  ticket_code: string;
  h_name: string;
  category: string;
  guest_d_id: string;
  title: string;
  name: string;
  table_number: string;
  seat_number: string;
  is_vegetarian: boolean;
  checked_in_at: string | null;
  is_absent: boolean;
}

export interface ActivityLog {
  id: string;
  message: string;
  created_at: string;
  created_by: string;
}

export interface GuestDWithRelation extends GuestD {
  guest_h?: {
    ticket_code: string;
    category: string;
    name: string;
  };
}

export interface Seat {
  seat_id: string;
  table_number: string;
  seat_number: string;
  x_position: number;
  y_position: number;
}

export interface SeatWithGuestBinding {
  seat_id: string;
  table_number: string;
  seat_number: string;
  x_position: number;
  y_position: number;
  guest_d_id: string | null;
  checked_in_at: string | null;
  is_absent: boolean | false;
}
