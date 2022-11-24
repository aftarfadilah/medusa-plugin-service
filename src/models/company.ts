import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany
} from "typeorm"

import { SoftDeletableEntity } from "@medusajs/medusa";
import { Location } from "./location";
import { Calendar } from "./calendar";
import { generateEntityId,  } from "@medusajs/medusa/dist/utils";
  
@Entity()
export class Company extends SoftDeletableEntity {
    @Index()
    @Column({ type: "varchar", nullable: true })
    name: string | null

    @OneToMany(() => Location, (l) => l.company)
    @JoinColumn({ name: "id" })
    locations: Location | null

    @ManyToMany(() => Calendar, { cascade: ["insert"] })
    @JoinTable({
        name: "division",
        joinColumn: {
        name: "company_id",
        referencedColumnName: "id",
        },
        inverseJoinColumn: {
        name: "calendar_id",
        referencedColumnName: "id",
        },
    })
    calendars: Calendar[]
  
    @Column({ type: "timestamp with time zone", nullable: true })
    work_day_from: Date | null
  
    @Column({ type: "timestamp with time zone", nullable: true })
    work_day_to: Date | null
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "comp")
    }
}