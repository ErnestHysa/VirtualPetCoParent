export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          color: string
          hunger_level: number
          happiness_level: number
          energy_level: number
          last_cared_for: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          species: string
          color: string
          hunger_level?: number
          happiness_level?: number
          energy_level?: number
          last_cared_for?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string
          color?: string
          hunger_level?: number
          happiness_level?: number
          energy_level?: number
          last_cared_for?: string
          created_at?: string
          updated_at?: string
        }
      }
      pairing_codes: {
        Row: {
          id: string
          user_id: string
          pet_id: string
          code: string
          partner_user_id: string | null
          status: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pet_id: string
          code: string
          partner_user_id?: string | null
          status?: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pet_id?: string
          code?: string
          partner_user_id?: string | null
          status?: string
          expires_at?: string
          created_at?: string
        }
      }
    }
  }
}
