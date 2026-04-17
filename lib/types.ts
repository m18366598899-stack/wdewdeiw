export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type RequestType = "credit" | "debit" | "correction";
export type ApprovalDecision = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          nickname: string;
          avatar_url: string | null;
          pair_room_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      pair_rooms: {
        Row: {
          id: string;
          member_a: string;
          member_b: string | null;
          unit_name: string;
          status: "pending_pairing" | "active" | "archived";
          created_at: string;
          updated_at: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          pair_room_id: string;
          code: string;
          inviter_id: string;
          invitee_id: string | null;
          status: "active" | "accepted" | "expired" | "revoked";
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
        };
      };
      point_requests: {
        Row: {
          id: string;
          pair_room_id: string;
          request_type: RequestType;
          points: number;
          note: string;
          initiated_by: string;
          status: RequestStatus;
          correction_for_request_id: string | null;
          effective_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          point_request_id: string;
          approver_id: string;
          decision: ApprovalDecision;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          pair_room_id: string;
          actor_id: string;
          action: string;
          target_table: string;
          target_id: string;
          metadata: Json;
          created_at: string;
        };
      };
      pair_room_balances: {
        Row: {
          pair_room_id: string;
          total_points: number;
        };
      };
    };
    Functions: {
      create_invitation_code: {
        Args: Record<string, never>;
        Returns: {
          code: string;
          invitation_id: string;
          pair_room_id: string;
        }[];
      };
      join_invitation_code: {
        Args: {
          input_code: string;
        };
        Returns: string;
      };
      create_point_request: {
        Args: {
          input_pair_room_id: string;
          input_request_type: RequestType;
          input_points: number;
          input_note: string;
          input_correction_for_request_id?: string | null;
        };
        Returns: string;
      };
      decide_point_request: {
        Args: {
          input_approval_id: string;
          input_decision: "approved" | "rejected";
        };
        Returns: string;
      };
      cancel_point_request: {
        Args: {
          input_request_id: string;
        };
        Returns: string;
      };
      archive_pair_room: {
        Args: {
          input_pair_room_id: string;
        };
        Returns: boolean;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PairRoom = Database["public"]["Tables"]["pair_rooms"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type PointRequest = Database["public"]["Tables"]["point_requests"]["Row"];
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
