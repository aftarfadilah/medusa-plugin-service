import { validator } from "../../../../utils/validator"
import { IsString, IsObject, IsDate, IsOptional, IsEnum, IsBoolean, NotEquals, ValidateIf } from "class-validator"
import { Type } from "class-transformer"
import AppointmentService from "../../../../services/appointment"
import { EntityManager } from "typeorm"
import { defaultAdminAppointmentFields, defaultAdminAppointmentRelations } from "."
import { AppointmentStatus } from "../../../../models/appointment"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostAppointmentsAppointmentReq, req.body)

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await appointmentService
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const appointment = await appointmentService.retrieve(id, {
        select: defaultAdminAppointmentFields,
        relations: defaultAdminAppointmentRelations,
    })

    res.json({ appointment })
}

export class AdminPostAppointmentsAppointmentReq {
    @IsOptional()
    @IsEnum(AppointmentStatus)
    @NotEquals(null)
    @ValidateIf((object, value) => value !== undefined)
    status?: AppointmentStatus

    @IsString()
    @IsOptional()
    display_id?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    notified_via_email_at?: Date

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    notified_via_sms_at?: Date

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from?: Date

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to?: Date

    @IsString()
    @IsOptional()
    order_id?: string

    @IsBoolean()
    @IsOptional()
    is_confirmed?: boolean

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}

