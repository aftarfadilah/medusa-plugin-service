import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    Generated
} from "typeorm"

import { Order, LineItem, SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { Location } from "./location";

@Entity()
export class DefaultWorkingHour extends SoftDeletableEntity {
    @Column({ type: "varchar", nullable: true })
    location_id: string | null
  
    @ManyToOne(() => Location)
    @JoinColumn({ name: "location_id" })
    location: Location | null

    @Column({ type: "integer", nullable: true })
    day: number | null

    @Column({ type: "time without time zone", nullable: true })
    from: string | null
  
    @Column({ type: "time without time zone", nullable: true })
    to: string | null

    @Column({ type: "boolean"})
    is_working_day: boolean
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "dwho")
    }
}