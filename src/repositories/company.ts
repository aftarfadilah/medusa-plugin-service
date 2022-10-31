import {
    EntityRepository,
    FindOperator,
    Repository,
  } from "typeorm"
import { flatten, groupBy, map, merge } from "lodash"
import { Company } from "../models/company"
import {
    ExtendedFindConfig,
    Selector,
} from "@medusajs/medusa/dist/types/common"

export type CompanySelector = Omit<Selector<Company>, "tags"> & {
    tags: FindOperator<string[]>
}
  
export type DefaultWithoutRelations = Omit<
    ExtendedFindConfig<Company, CompanySelector>,
    "relations"
>
  
export type FindWithoutRelationsOptions = DefaultWithoutRelations & {
    where: DefaultWithoutRelations["where"]
}

@EntityRepository(Company)
export class CompanyRepository extends Repository<Company> {
    private mergeEntitiesWithRelations(
        entitiesAndRelations: Array<Partial<Company>>
    ): Company[] {
        const entitiesAndRelationsById = groupBy(entitiesAndRelations, "id")
        return map(entitiesAndRelationsById, (entityAndRelations) =>
            merge({}, ...entityAndRelations)
        )
    }

    public async findOneWithRelations(
        relations: string[] = [],
        optionsWithoutRelations: FindWithoutRelationsOptions = { where: {} }
    ): Promise<Company> {
        // Limit 1
        optionsWithoutRelations.take = 1

        const result = await this.findWithRelations(
            relations,
            optionsWithoutRelations
        )
        return result[0]
    }

    private async queryCompanies(
        optionsWithoutRelations: FindWithoutRelationsOptions,
        shouldCount = false
    ): Promise<[Company[], number]> {
        const tags = optionsWithoutRelations?.where?.tags
        delete optionsWithoutRelations?.where?.tags

        const qb = this.createQueryBuilder("company")
            .select(["company.id"])
            .skip(optionsWithoutRelations.skip)
            .take(optionsWithoutRelations.take)

        if (optionsWithoutRelations.where) {
            qb.where(optionsWithoutRelations.where)
        }

        if (optionsWithoutRelations.order) {
            const toSelect: string[] = []
            const parsed = Object.entries(optionsWithoutRelations.order).reduce(
                (acc, [k, v]) => {
                    const key = `company.${k}`
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

        let entities: Company[]
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

    private async queryCompaniesWithIds(
        entityIds: string[],
        groupedRelations: { [toplevel: string]: string[] },
        withDeleted = false,
        select: (keyof Company)[] = []
    ): Promise<Company[]> {
        const entitiesIdsWithRelations = await Promise.all(
            Object.entries(groupedRelations).map(async ([toplevel, rels]) => {
                let querybuilder = this.createQueryBuilder("companies")

                if (select && select.length) {
                    querybuilder.select(select.map((f) => `companies.${f}`))
                }
                querybuilder = querybuilder.leftJoinAndSelect(
                    `companies.${toplevel}`,
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
                        .where("companies.id IN (:...entitiesIds)", {
                            entitiesIds: entityIds,
                        })
                        .withDeleted()
                } else {
                    querybuilder = querybuilder.where(
                        "companies.deleted_at IS NULL AND companies.id IN (:...entitiesIds)",
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
    ): Promise<Company[]> {
        let entities: Company[]
        if (Array.isArray(idsOrOptionsWithoutRelations)) {
            entities = await this.findByIds(idsOrOptionsWithoutRelations, {
                withDeleted,
            })
        } else {
            const result = await this.queryCompanies(
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
        const entitiesIdsWithRelations = await this.queryCompaniesWithIds(
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