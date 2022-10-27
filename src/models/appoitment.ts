import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne
} from "typeorm"

import { Order, SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { Calendar } from "./calendar";
import { generateEntityId,  } from "@medusajs/medusa/dist/utils";

export enum AppoitmentStatus {
    NOT_PAID = "not_paid",
    AWAITING = "awaiting",
    CAPTURED = "captured",
    PARTIALLY_REFUNDED = "partially_refunded",
    REFUNDED = "refunded",
    CANCELED = "canceled",
    REQUIRES_ACTION = "requires_action",
}

@Entity()
export class Appoitment extends SoftDeletableEntity {
    @Index()
    @DbAwareColumn({ type: "enum", enum: AppoitmentStatus, default: "not_paid" })
    payment_status: AppoitmentStatus

    @Column({ type: "varchar", nullable: true })
    location: string | null

    @Column({ type: "timestamp with time zone", nullable: true })
    notified_via_email_at: Date | null
  
    @Column({ type: "timestamp with time zone", nullable: true })
    notified_via_sms_at: Date | null

    @Column({ type: "timestamp with time zone", nullable: true })
    from: Date | null
  
    @Column({ type: "timestamp with time zone", nullable: true })
    to: Date | null

    @Column({ type: "varchar", nullable: true })
    order_id: string | null
  
    @ManyToOne(() => Order)
    @JoinColumn({ name: "order_id" })
    order: Order | null

    @Column({ type: "varchar", nullable: true })
    code: string | null

    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown>
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "calt")
        this.code = generateEntityId(this.code)
    }
}