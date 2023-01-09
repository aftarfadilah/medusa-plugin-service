import { EntityRepository, Repository } from "typeorm"
import { Division } from "../models/division"

@EntityRepository(Division)
export class DivisionRepository extends Repository<Division> {}