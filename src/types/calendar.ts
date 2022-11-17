export type CreateCalendarInput = {
    name: string
    color: string
    metadata?: Record<string, unknown>
}

export type UpdateCalendarInput = CreateCalendarInput;

export type selector = {
    name?: string
    from?: Date
    to?: Date
}