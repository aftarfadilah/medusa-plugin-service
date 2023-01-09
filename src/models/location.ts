import {
    BeforeInsert,
    Column,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
} from "typeorm"

import { Country, SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { generateEntityId  } from "@medusajs/medusa/dist/utils";
import { Company } from "./company";
import { Calendar } from "./calendar";
  
@Entity()
export class Location extends SoftDeletableEntity {
    @Index()
    @Column({ type: "varchar", nullable: true })
    title: string | null
  
    @Column({ type: "varchar", nullable: true })
    code: string | null
  
    @Column({ type: "varchar", nullable: true })
    first_name: string | null
  
    @Column({ type: "varchar", nullable: true })
    last_name: string | null

    @Column({ type: "varchar", nullable: true })
    company_id: string | null

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company | null

    @ManyToMany(() => Calendar, {})
    @JoinTable({
        name: "division",
        joinColumn: {
            name: "location_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "calendar_id",
            referencedColumnName: "id",
        },
    })
    calendars: Calendar[]
  
    @Column({ type: "varchar", nullable: true })
    address_1: string | null
  
    @Column({ type: "varchar", nullable: true })
    address_2: string | null
  
    @Column({ type: "varchar", nullable: true })
    city: string | null
  
    @Column({ type: "varchar", nullable: true })
    country_code: string | null
  
    @ManyToOne(() => Country)
    @JoinColumn({ name: "country_code", referencedColumnName: "iso_2" })
    country: Country | null
  
    @Column({ type: "varchar", nullable: true })
    province: string | null
  
    @Column({ type: "varchar", nullable: true })
    postal_code: string | null
  
    @Column({ type: "varchar", nullable: true })
    phone: string | null

    @Column({ type: "varchar", nullable: true })
    longitude: string | null

    @Column({ type: "varchar", nullable: true })
    latitude: string | null
  
    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown>
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "loct")
        this.code = generateEntityId(this.code)
    }
}