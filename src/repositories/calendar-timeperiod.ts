import { EntityRepository, Repository } from "typeorm"
import { CalendarTimeperiod } from "../models/calendar-timeperiod"

@EntityRepository(CalendarTimeperiod)
export class CalendarTimeperiodRepository extends Repository<CalendarTimeperiod> {}