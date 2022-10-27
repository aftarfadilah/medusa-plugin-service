import { TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"

class LocationHandlerService extends TransactionBaseService {
    Events = {
        UPDATED: "location.updated",
        CREATED: "location.created",
        DELETED: "location.deleted",
    }

    constructor({ locationRepository, manager, eventBusService }) {
        super({ locationRepository, manager, eventBusService });

        this.locationRepository_ = locationRepository;
        this.manager_ = manager;
        this.eventBus_ = eventBusService;
    }

    async list() {
        const locationRepository = this.manager_.getCustomRepository(this.locationRepository_);
        return await locationRepository.find();
    }

    async retrieve(locationId, config ) {
        return await this.retrieve_({ id: locationId }, config)
    }

    async retrieve_( selector, config ) {
        const manager = this.manager_
        const locationRepo = manager.getCustomRepository(this.locationRepository_)
    
        const { relations, ...query } = buildQuery(selector, config)
    
        const location = await locationRepo.findOneWithRelations(
          relations,
          query
        )
    
        if (!location) {
          const selectorConstraints = Object.entries(selector)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
    
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Location with ${selectorConstraints} was not found`
          )
        }
    
        return location
    }

    async create(req, res) {
        return await this.atomicPhase_(async (manager) => {
            const locationRepo = this.manager_.getCustomRepository(this.locationRepository_);
        
            // const { 
            //     title,
            //     first_name,
            //     last_name,
            //     address_1,
            //     address_2,
            //     city,
            //     country_code,
            //     province,
            //     postal_code,
            //     phone,
            //     metadata
            // } = req.body;
            
            try {
                let location = await locationRepo.create(req.body);
                location = await locationRepo.save(location);

                const result = await this.retrieve(location.id, {
                    relations: ["country"],
                })

                await this.eventBus_
                .withTransaction(manager)
                .emit(this.Events.CREATED, {
                    id: result.id,
                })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }
}

export default LocationHandlerService;