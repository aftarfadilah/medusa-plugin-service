import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";

import { SoftDeletableEntity } from "@medusajs/medusa";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";
import { generateEntityId } from "@medusajs/medusa/dist/utils/generate-entity-id";
import { CalendarTimeperiod } from "./calendar-timeperiod";
import { Division } from "./division";

@Entity()
export class Calendar extends SoftDeletableEntity {
  @Index()
  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar", nullable: true, default: "#D3D3D3" })
  color: string;

  @OneToMany(() => CalendarTimeperiod, (ct) => ct.calendar)
  @JoinColumn({ name: "id" })
  timeperiods: CalendarTimeperiod | null;

  @Column({ type: "varchar", nullable: true })
  division_id: string | null

  @OneToOne(() => Division, (d) => d.calendar)
  @JoinColumn({ name: "division_id" })
  division: Division | null;

  @DbAwareColumn({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown>;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "cale");
  }
}
