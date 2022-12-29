import { EntityRepository, Repository } from "typeorm"
import { ServiceSetting } from "../models/service-setting"

@EntityRepository(ServiceSetting)
export class ServiceSettingRepository extends Repository<ServiceSetting> {}