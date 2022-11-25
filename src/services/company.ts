import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { CompanyRepository } from "../repositories/company";
import { Company } from '../models/company';
import { CreateCompanyInput, UpdateCompanyInput } from '../types/company';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';

type InjectedDependencies = {
    manager: EntityManager
    companyRepository: typeof CompanyRepository
    eventBusService: EventBusService
}

class CompanyService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly companyRepository_: typeof CompanyRepository
    protected readonly eventBus_: EventBusService

    static readonly IndexName = `companies`
    static readonly Events = {
        UPDATED: "company.updated",
        CREATED: "company.created",
        DELETED: "company.deleted",
    }

    constructor({ manager, companyRepository, eventBusService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.companyRepository_ = companyRepository;
        this.eventBus_ = eventBusService;
    }

    async list(
        selector: Selector<Company>,
        config: FindConfig<Company> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<Company[]> {
        const companyRepo = this.manager_.getCustomRepository(this.companyRepository_)
    
        const query = buildQuery(selector, config)
    
        return companyRepo.find(query)
    }

    async retrieve(companyId, config) {
        const manager = this.manager_
        const companyRepo = manager.getCustomRepository(this.companyRepository_)

        const company = await companyRepo.findOne(companyId, config)

        if (!company) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Company with ${companyId} was not found`
            )
        }

        return company
    }

    async create(companyObject: CreateCompanyInput): Promise<Company> {
        return await this.atomicPhase_(async (manager) => {
            const companyRepo = manager.getCustomRepository(this.companyRepository_)

            const {
                ...rest
            } = companyObject

            try {
                let company: any = companyRepo.create(rest)
                company = await companyRepo.save(company)

                const result = await this.retrieve(company.id, {
                    relations: ["locations"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(CompanyService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(companyId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const companyRepo = manager.getCustomRepository(this.companyRepository_)

            const company = await companyRepo.findOne(
                { id: companyId },
                { relations: ["locations"] }
            )

            if (!company) {
                return
            }

            await companyRepo.softRemove(company)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CompanyService.Events.DELETED, {
                    id: companyId,
                })

            return Promise.resolve()
        })
    }

    async update(
        companyId: string,
        update: UpdateCompanyInput
    ): Promise<Company> {
        return await this.atomicPhase_(async (manager) => {
            const companyRepo = manager.getCustomRepository(this.companyRepository_)

            const company = await this.retrieve(companyId, {})

            const {
                ...rest
            } = update

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    company[key] = value
                }
            }

            const result = await companyRepo.save(company)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CompanyService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }
}

export default CompanyService;