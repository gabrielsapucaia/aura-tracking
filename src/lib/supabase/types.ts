export type OperatorStatus = "active" | "inactive";
export type UserRole = "admin" | "supervisor" | "user";
export type EquipmentStatus = "active" | "inactive";

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
      user_roles: {
        Row: {
          user_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      equipment_types: {
        Row: {
          id: string | number;
          name: string;
          description: string | null;
          status: EquipmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string | number;
          name: string;
          description?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string | number;
          name?: string;
          description?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          tag: string;
          type_id: string | null;
          status: EquipmentStatus;
          created_at: string;
          updated_at: string;
          seq_id?: number | null;
          equipment_types?: {
            name: string;
          } | null;
        };
        Insert: {
          id?: string;
          tag: string;
          type_id?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Update: {
          id?: string;
          tag?: string;
          type_id?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_type_id_fkey";
            columns: ["type_id"];
            referencedRelation: "equipment_types";
            referencedColumns: ["id"];
          }
        ];
      };
      material_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: EquipmentStatus;
          created_at: string;
          updated_at: string;
          seq_id?: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: EquipmentStatus;
          created_at?: string;
          updated_at?: string;
          seq_id?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      toggle_operator_status: {
        Args: {
          op_id: number;
        };
        Returns: Database["public"]["Tables"]["operators"]["Row"];
      };
      toggle_equipment_status: {
        Args: {
          eq_id: string;
        };
        Returns: Database["public"]["Tables"]["equipment"]["Row"];
      };
    };
    Enums: {
      operator_status: OperatorStatus;
      user_role: UserRole;
      equipment_status: EquipmentStatus;
    };
  };
}

export type OperatorRecord = Database["public"]["Tables"]["operators"]["Row"];
export type EquipmentTypeRecord = Database["public"]["Tables"]["equipment_types"]["Row"];
export type EquipmentRecord = Database["public"]["Tables"]["equipment"]["Row"];
export type MaterialTypeRecord = Database["public"]["Tables"]["material_types"]["Row"];
