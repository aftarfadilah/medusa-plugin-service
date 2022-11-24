export type CreateCompanyInput = {
    name: string
    work_day_from: Date
    work_day_to: Date
}

export type UpdateCompanyInput = CreateCompanyInput;

export type selector = {
    name?: string
}