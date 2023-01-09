export type CreateDefaultWorkingHourInput = {
    location_id: string
    day: number
    from: string
    to: string
    is_working_day: boolean
}

export type UpdateDefaultWorkingHourInput = {
    day?: number
    from?: string
    to?: string
    is_working_day?: boolean
}

export type selector = {
    name?: string
}