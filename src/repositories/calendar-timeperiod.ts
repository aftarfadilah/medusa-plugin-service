import {
    EntityRepository,
    FindOperator,
    Repository,
  } from "typeorm"
import { flatten, groupBy, map, merge } from "lodash"
import { CalendarTimeperiod } from "../models/calendar-timeperiod"
import {
    ExtendedFindConfig,
    Selector,
} from "@medusajs/medusa/dist/types/common"

export type CalendarTimeperiodSelector = Omit<Selector<CalendarTimeperiod>, "from"> & {
    from: FindOperator<Date>
}
  
export type DefaultWithoutRelations = Omit<
    ExtendedFindConfig<CalendarTimeperiod, CalendarTimeperiodSelector>,
    "relations"
>
  
export type FindWithoutRelationsOptions = DefaultWithoutRelations & {
    where: DefaultWithoutRelations["where"]
}

@EntityRepository(CalendarTimeperiod)
export class CalendarTimeperiodRepository extends Repository<CalendarTimeperiod> {
    private mergeEntitiesWithRelations(
        entitiesAndRelations: Array<Partial<CalendarTimeperiod>>
    ): CalendarTimeperiod[] {
        const entitiesAndRelationsById = groupBy(entitiesAndRelations, "id")
        return map(entitiesAndRelationsById, (entityAndRelations) =>
            merge({}, ...entityAndRelations)
        )
    }

    public async findOneWithRelations(
        relations: string[] = [],
        optionsWithoutRelations: FindWithoutRelationsOptions = { where: {} }
    ): Promise<CalendarTimeperiod> {
        // Limit 1
        optionsWithoutRelations.take = 1

        const result = await this.findWithRelations(
            relations,
            optionsWithoutRelations
        )
        return result[0]
    }

    private async queryCalendarTimeperiods(
        optionsWithoutRelations: FindWithoutRelationsOptions,
        shouldCount = false
    ): Promise<[CalendarTimeperiod[], number]> {

        const qb = this.createQueryBuilder("calendartimeperiod")
            .select(["calendartimeperiod.id"])
            .skip(optionsWithoutRelations.skip)
            .take(optionsWithoutRelations.take)

        if (optionsWithoutRelations.where) {
            qb.where(optionsWithoutRelations.where)
        }

        if (optionsWithoutRelations.order) {
            const toSelect: string[] = []
            const parsed = Object.entries(optionsWithoutRelations.order).reduce(
                (acc, [k, v]) => {
                    const key = `calendartimeperiod.${k}`
                    toSelect.push(key)
                    acc[key] = v
                    return acc
                },
                {}
            )
            qb.addSelect(toSelect)
            qb.orderBy(parsed)
        }

        if (optionsWithoutRelations.withDeleted) {
            qb.withDeleted()
        }

        let entities: CalendarTimeperiod[]
        let count = 0
        if (shouldCount) {
            const result = await qb.getManyAndCount()
            entities = result[0]
            count = result[1]
        } else {
            entities = await qb.getMany()
        }

        return [entities, count]
    }

    private getGroupedRelations(relations: string[]): {
        [toplevel: string]: string[]
    } {
        const groupedRelations: { [toplevel: string]: string[] } = {}
        for (const rel of relations) {
            const [topLevel] = rel.split(".")
            if (groupedRelations[topLevel]) {
                groupedRelations[topLevel].push(rel)
            } else {
                groupedRelations[topLevel] = [rel]
            }
        }

        return groupedRelations
    }

    private async queryCalendarTimeperiodsWithIds(
        entityIds: string[],
        groupedRelations: { [toplevel: string]: string[] },
        withDeleted = false,
        select: (keyof CalendarTimeperiod)[] = []
    ): Promise<CalendarTimeperiod[]> {
        const entitiesIdsWithRelations = await Promise.all(
            Object.entries(groupedRelations).map(async ([toplevel, rels]) => {
                let querybuilder = this.createQueryBuilder("calendartimeperiods")

                if (select && select.length) {
                    querybuilder.select(select.map((f) => `calendartimeperiods.${f}`))
                }
                querybuilder = querybuilder.leftJoinAndSelect(
                    `calendartimeperiods.${toplevel}`,
                    toplevel
                )

                for (const rel of rels) {
                    const [_, rest] = rel.split(".")
                    if (!rest) {
                        continue
                    }
                    // Regex matches all '.' except the rightmost
                    querybuilder = querybuilder.leftJoinAndSelect(
                        rel.replace(/\.(?=[^.]*\.)/g, "__"),
                        rel.replace(".", "__")
                    )
                }

                if (withDeleted) {
                    querybuilder = querybuilder
                        .where("calendartimeperiods.id IN (:...entitiesIds)", {
                            entitiesIds: entityIds,
                        })
                        .withDeleted()
                } else {
                    querybuilder = querybuilder.where(
                        "calendartimeperiods.deleted_at IS NULL AND calendartimeperiods.id IN (:...entitiesIds)",
                        {
                            entitiesIds: entityIds,
                        }
                    )
                }

                return querybuilder.getMany()
            })
        ).then(flatten)

        return entitiesIdsWithRelations
    }

    public async findWithRelations(
        relations: string[] = [],
        idsOrOptionsWithoutRelations: FindWithoutRelationsOptions | string[] = {
            where: {},
        },
        withDeleted = false
    ): Promise<CalendarTimeperiod[]> {
        let entities: CalendarTimeperiod[]
        if (Array.isArray(idsOrOptionsWithoutRelations)) {
            entities = await this.findByIds(idsOrOptionsWithoutRelations, {
                withDeleted,
            })
        } else {
            const result = await this.queryCalendarTimeperiods(
                idsOrOptionsWithoutRelations,
                false
            )
            entities = result[0]
        }
        const entitiesIds = entities.map(({ id }) => id)

        if (entitiesIds.length === 0) {
            // no need to continue
            return []
        }

        if (
            relations.length === 0 &&
            !Array.isArray(idsOrOptionsWithoutRelations)
        ) {
            return await this.findByIds(entitiesIds, idsOrOptionsWithoutRelations)
        }

        const groupedRelations = this.getGroupedRelations(relations)
        const entitiesIdsWithRelations = await this.queryCalendarTimeperiodsWithIds(
            entitiesIds,
            groupedRelations,
            withDeleted
        )

        const entitiesAndRelations = entitiesIdsWithRelations.concat(entities)
        const entitiesToReturn =
            this.mergeEntitiesWithRelations(entitiesAndRelations)

        return entitiesToReturn
    }
}