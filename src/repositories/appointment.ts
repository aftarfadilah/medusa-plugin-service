import { EntityRepository, Repository } from "typeorm"
import { Appointment } from "../models/appointment"

@EntityRepository(Appointment)
export class AppointmentRepository extends Repository<Appointment> {}