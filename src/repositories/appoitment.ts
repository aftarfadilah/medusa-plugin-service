import { EntityRepository, Repository } from "typeorm"

import { Appoitment } from "../models/appoitment"

@EntityRepository(Appoitment)
export class AppoitmentRepository extends Repository<Appoitment> { }