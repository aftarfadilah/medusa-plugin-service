import { EntityRepository, Repository } from "typeorm"
import { DefaultWorkingHour } from "../models/default-working-hour"

@EntityRepository(DefaultWorkingHour)
export class DefaultWorkingHourRepository extends Repository<DefaultWorkingHour> {}