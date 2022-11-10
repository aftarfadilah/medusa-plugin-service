import { EntityRepository, Repository } from "typeorm"
import { Calendar } from "../models/calendar"

@EntityRepository(Calendar)
export class CalendarRepository extends Repository<Calendar> {}