export type CreateLocationInput = {
    title: string
    company_id: string
    first_name: string
    last_name: string
    address_1: string
    address_2: string
    city: string
    country_code: string
    province: string
    postal_code: string
    phone: string
    metadata?: Record<string, unknown>
}

export type UpdateLocationInput = CreateLocationInput;

export type selector = {
    code?: string
}