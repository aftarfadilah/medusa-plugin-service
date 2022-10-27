import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne
} from "typeorm"

import { SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { Calendar } from "./calendar";
import { generateEntityId,  } from "@medusajs/medusa/dist/utils";
  
@Entity()
export class CalendarTimeperiod extends SoftDeletableEntity {
    @Index()
    @Column({ type: "varchar", nullable: true })
    title: string | null

    @Column({ type: "timestamp with time zone", nullable: true })
    from: Date | null
  
    @Column({ type: "timestamp with time zone", nullable: true })
    to: Date | null
  
    @Column({ type: "varchar", nullable: true })
    type: string | null

    @Column({ type: "varchar", nullable: true })
    calendar_id: string | null
  
    @ManyToOne(() => Calendar)
    @JoinColumn({ name: "calendar_id" })
    calendar: Calendar | null

    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown>
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "calt")
    }
}