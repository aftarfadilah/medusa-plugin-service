import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryColumn
} from "typeorm"

import { generateEntityId } from "@medusajs/medusa/dist/utils/generate-entity-id";
import { Calendar } from "./calendar";
import { Location } from "./location";
  
@Entity()
export class Division {
    @PrimaryColumn()
    id: string

    @Index()
    @Column({ type: "varchar", nullable: false })
    location_id: string
  
    @Index()
    @Column({ type: "varchar", nullable: false })
    calendar_id: string

    @OneToOne(() => Calendar, (c) => c.id)
    @JoinColumn({ name: "calendar_id" })
    calendar: Calendar | null

    @OneToOne(() => Location, (l) => l.id)
    @JoinColumn({ name: "location_id" })
    location: Location | null
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "divi")
    }
}