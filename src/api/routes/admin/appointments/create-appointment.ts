import { IsString, IsObject, IsDate, IsOptional, IsEnum, IsBoolean } from "class-validator"
import { Type } from "class-transformer"
import AppointmentService from "../../../../services/appointment";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"
import { AppointmentStatus } from "../../../../models/appointment";

export default async (req, res) => {
    const validated = await validator(AdminPostAppointmentsReq, req.body)

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await appointmentService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ appointment: result })
}

export class AdminPostAppointmentsReq {    
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status: AppointmentStatus = AppointmentStatus.DRAFT

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
    order_id: string

    @IsBoolean()
    is_confirmed: boolean

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}
