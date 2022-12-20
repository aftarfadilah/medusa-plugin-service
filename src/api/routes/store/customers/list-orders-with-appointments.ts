import AppointmentService from "../../../../services/appointment"
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator"
import { Type } from "class-transformer"
import {
    OrderService,
    FulfillmentStatus,
    OrderStatus,
    PaymentStatus,
} from "@medusajs/medusa"
import { DateComparisonOperator } from "@medusajs/medusa/dist/types/common"

export default async (req, res) => {
    const id: string | undefined = req.user?.customer_id

    const orderService: OrderService = req.scope.resolve("orderService")
    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")

    req.filterableFields = {
        ...req.filterableFields,
        customer_id: id,
    }

    const [orders, count] = await orderService.listAndCount(
        req.filterableFields,
        req.listConfig
    )

    const { limit, offset } = req.validatedQuery
    
    // Todo Inject Appointment List into Order, since Appointment don't have relations with Order
    for (const x of orders) {
        const [appointments, count] = await appointmentService.list({ order_id: x.id }, {
            relations: [],
            skip: 0,
            take: 50
        })

        // @ts-ignore
        x.appointments = appointments
    }

    res.json({ orders, count, offset: offset, limit: limit })
}


export class StoreGetCustomersCustomerOrdersPaginationParams {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit = 10
  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    offset = 0
  
    @IsOptional()
    @IsString()
    fields?: string
  
    @IsOptional()
    @IsString()
    expand?: string
}
  
// eslint-disable-next-line max-len
export class StoreGetCustomersCustomerOrdersParams extends StoreGetCustomersCustomerOrdersPaginationParams {
    @IsString()
    @IsOptional()
    id?: string
  
    @IsString()
    @IsOptional()
    q?: string
  
    @IsOptional()
    @IsEnum(OrderStatus, { each: true })
    status?: OrderStatus[]
  
    @IsOptional()
    @IsEnum(FulfillmentStatus, { each: true })
    fulfillment_status?: FulfillmentStatus[]
  
    @IsOptional()
    @IsEnum(PaymentStatus, { each: true })
    payment_status?: PaymentStatus[]
  
    @IsString()
    @IsOptional()
    display_id?: string
  
    @IsString()
    @IsOptional()
    cart_id?: string
  
    @IsString()
    @IsOptional()
    email?: string
  
    @IsString()
    @IsOptional()
    region_id?: string
  
    @IsString()
    @IsOptional()
    currency_code?: string
  
    @IsString()
    @IsOptional()
    tax_rate?: string
  
    @IsOptional()
    @ValidateNested()
    @Type(() => DateComparisonOperator)
    created_at?: DateComparisonOperator
  
    @IsOptional()
    @ValidateNested()
    @Type(() => DateComparisonOperator)
    updated_at?: DateComparisonOperator
  
    @ValidateNested()
    @IsOptional()
    @Type(() => DateComparisonOperator)
    canceled_at?: DateComparisonOperator
}