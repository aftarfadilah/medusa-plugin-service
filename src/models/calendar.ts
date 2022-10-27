import {
    BeforeInsert,
    Column,
    Entity,
    Index
} from "typeorm"

import { SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { generateEntityId } from "@medusajs/medusa/dist/utils/generate-entity-id";
  
@Entity()
export class Calendar extends SoftDeletableEntity {
    @Index()
    @Column({ type: "varchar", nullable: true })
    name: string | null
  
    @Column({ type: "varchar", nullable: true })
    color: string | null
  
    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown>
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "cale")
    }
}