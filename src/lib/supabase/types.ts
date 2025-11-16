export type OperatorStatus = "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      operators: {
        Row: {
          id: number;
          name: string;
          pin: string;
          status: OperatorStatus;
          created_at: string;
          updated_at: string;
          seq_id?: number | null;
        };
        Insert: {
          id?: number;
          name: string;
          pin: string;
          status?: OperatorStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Update: {
          id?: number;
          name?: string;
          pin?: string;
          status?: OperatorStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      operator_status: OperatorStatus;
    };
  };
}

export type OperatorRecord = Database["public"]["Tables"]["operators"]["Row"];
