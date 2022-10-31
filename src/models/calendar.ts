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
    @Column({ type: "varchar", nullable: false })
    name: string
  
    @Column({ type: "varchar", nullable: true, default: "#D3D3D3" })
    color: string
  
    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown>
  
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "cale")
    }
}