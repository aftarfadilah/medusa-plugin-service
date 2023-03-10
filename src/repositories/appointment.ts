import { EntityRepository, FindManyOptions, Repository } from "typeorm";
import { flatten, groupBy, map, merge } from "lodash";
import { Appointment } from "../models/appointment";

@EntityRepository(Appointment)
export class AppointmentRepository extends Repository<Appointment> {
  public async findWithRelations(
    relations: string[] = [],
    optionsWithoutRelations: Omit<
      FindManyOptions<Appointment>,
      "relations"
    > = {}
  ): Promise<Appointment[]> {
    const entities = await this.find(optionsWithoutRelations);

    const entitiesIds = entities.map(({ id }) => id);

    const groupedRelations = {};
    for (const rel of relations) {
      const [topLevel] = rel.split(".");
      if (groupedRelations[topLevel]) {
        groupedRelations[topLevel].push(rel);
      } else {
        groupedRelations[topLevel] = [rel];
      }
    }

    const entitiesIdsWithRelations = await Promise.all(
      Object.entries(groupedRelations).map(async ([_, rels]) => {

        return this.findByIds(entitiesIds, {
          select: ["id"],
          relations: rels as string[],
        });
      })
    ).then(flatten);

    const entitiesAndRelations = entitiesIdsWithRelations.concat(entities);

    const entitiesAndRelationsById = groupBy(entitiesAndRelations, "id");

    return map(entities, (e) => merge({}, ...entitiesAndRelationsById[e.id]));
  }

  public async findOneWithRelations(
    relations: string[] = [],
    optionsWithoutRelations: Omit<
      FindManyOptions<Appointment>,
      "relations"
    > = {}
  ): Promise<Appointment> {
    // Limit 1
    optionsWithoutRelations.take = 1;

    const result = await this.findWithRelations(
      relations,
      optionsWithoutRelations
    );
    return result[0];
  }
}
