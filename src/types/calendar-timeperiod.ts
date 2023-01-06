import { DateComparisonOperator } from "@medusajs/medusa/dist/types/common"

export type CreateCalendarTimeperiodInput = {
    title: string
    from: Date | string
    to: Date | string
    type: string
    calendar_id: string
    metadata?: Record<string, unknown>
}

export type UpdateCalendarTimeperiodInput = CreateCalendarTimeperiodInput;

export type selector = {
    from?: DateComparisonOperator
    to?: DateComparisonOperator
    calendar_id: string
}