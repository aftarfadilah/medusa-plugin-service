import { AppointmentStatus } from "../models/appointment"

export type CreateAppointmentInput = {
    display_id?: string
    notified_via_email_at?: Date | null
    notified_via_sms_at?: Date | null
    from?: Date | null
    to?: Date | null
    order_id: string
    is_confirmed: boolean
    status: AppointmentStatus
    metadata?: Record<string, unknown>
}

export type UpdateAppointmentInput = {
    display_id?: string
    notified_via_email_at?: Date | null
    notified_via_sms_at?: Date | null
    from?: Date | null
    to?: Date | null
    order_id?: string
    is_confirmed?: boolean
    status?: AppointmentStatus
    metadata?: Record<string, unknown>
};

export type selector = {
    code?: string
    name?: string
    order_id?: string
    from?: Date
    to?: Date
}