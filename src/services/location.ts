import { EventBusService, TransactionBaseService } from "@medusajs/medusa";
import { formatException } from "@medusajs/medusa/dist/utils/exception-formatter";
import { buildQuery } from "@medusajs/medusa/dist/utils/build-query";
import { MedusaError } from "medusa-core-utils";
import { EntityManager } from "typeorm";
import { LocationRepository } from "../repositories/location";
import { Location } from "../models/location";
import { CreateLocationInput, UpdateLocationInput } from "../types/location";
import { setMetadata } from "@medusajs/medusa/dist/utils";
import { FindConfig, Selector } from "@medusajs/medusa/dist/types/common";
import CalendarTimeperiodService from "./calendar-timeperiod";
import CalendarService from "./calendar";
import {
  addDay,
  countDays,
  divideTimes,
  formatDate,
  subDay,
  zeroTimes,
} from "../utils/date-utils";
import { union, includes } from "lodash";
import DefaultWorkingHourService from "./default-working-hour";
import ServiceSettingService from "./service-setting";

type InjectedDependencies = {
  manager: EntityManager;
  locationRepository: typeof LocationRepository;
  eventBusService: EventBusService;
  calendarService: CalendarService;
  calendarTimeperiodService: CalendarTimeperiodService;
  defaultWorkingHourService: DefaultWorkingHourService;
  serviceSettingService: ServiceSettingService;
};

class LocationService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  protected readonly locationRepository_: typeof LocationRepository;
  protected readonly eventBus_: EventBusService;
  protected readonly calendar_: CalendarService;
  protected readonly calendarTimeperiod_: CalendarTimeperiodService;
  protected readonly defaultWorkingHour_: DefaultWorkingHourService;
  protected readonly setting_: ServiceSettingService;

  static readonly IndexName = `locations`;
  static readonly Events = {
    UPDATED: "location.updated",
    CREATED: "location.created",
    DELETED: "location.deleted",
  };

  constructor({
    manager,
    locationRepository,
    eventBusService,
    calendarService,
    calendarTimeperiodService,
    defaultWorkingHourService,
    serviceSettingService
  }: InjectedDependencies) {
    super(arguments[0]);

    this.manager_ = manager;
    this.locationRepository_ = locationRepository;
    this.eventBus_ = eventBusService;
    this.calendar_ = calendarService;
    this.calendarTimeperiod_ = calendarTimeperiodService;
    this.defaultWorkingHour_ = defaultWorkingHourService;
    this.setting_ = serviceSettingService;
  }

  async list(
    selector: Selector<Location>,
    config: FindConfig<Location> = {
      skip: 0,
      take: 50,
      relations: [],
    }
  ): Promise<Location[]> {
    const locationRepo = this.manager_.getCustomRepository(
      this.locationRepository_
    );

    const query = buildQuery(selector, config);

    return locationRepo.find(query);
  }

  async retrieve(locationId: string, config: FindConfig<Location>) {
    const manager = this.manager_;
    const locationRepo = manager.getCustomRepository(this.locationRepository_);

    const location = await locationRepo.findOne(locationId, config);

    if (!location) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Location with ${locationId} was not found`
      );
    }

    return location;
  }

  async create(locationObject: CreateLocationInput): Promise<Location> {
    return await this.atomicPhase_(async (manager) => {
      const locationRepo = manager.getCustomRepository(
        this.locationRepository_
      );

      const { ...rest } = locationObject;

      try {
        let location: any = locationRepo.create(rest);
        location = await locationRepo.save(location);

        const result = await this.retrieve(location.id, {
          relations: ["country", "company"],
        });

        await this.eventBus_
          .withTransaction(manager)
          .emit(LocationService.Events.CREATED, {
            id: result.id,
          });
        return result;
      } catch (error) {
        throw formatException(error);
      }
    });
  }

  async delete(locationId: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const locationRepo = manager.getCustomRepository(
        this.locationRepository_
      );

      const location = await locationRepo.findOne(
        { id: locationId },
        { relations: ["country", "company"] }
      );

      if (!location) {
        return;
      }

      await locationRepo.softRemove(location);

      await this.eventBus_
        .withTransaction(manager)
        .emit(LocationService.Events.DELETED, {
          id: locationId,
        });

      return Promise.resolve();
    });
  }

  async update(
    locationId: string,
    update: UpdateLocationInput
  ): Promise<Location> {
    return await this.atomicPhase_(async (manager) => {
      const locationRepo = manager.getCustomRepository(
        this.locationRepository_
      );

      const location = await this.retrieve(locationId, {});

      const { metadata, ...rest } = update;

      if (metadata) {
        location.metadata = setMetadata(location, metadata);
      }

      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== `undefined`) {
          location[key] = value;
        }
      }

      const result = await locationRepo.save(location);

      await this.eventBus_
        .withTransaction(manager)
        .emit(LocationService.Events.UPDATED, {
          id: result.id,
          fields: Object.keys(update),
        });
      return result;
    });
  }

  // Todo Merge DWH to empty WorkingTimes
  mergeDefaultWorkingHourToWorkingSlotTimes(dwhSlotTimes, workingSlotTimes) {
    for (const workingTime of Object.entries(workingSlotTimes)) {
      const [wtKey, wtList] = workingTime
      const dayIndex = new Date(wtKey).getDay();

      const prevDay = new Date(subDay(wtKey, 1));
      const prevDayKey = formatDate(prevDay);
      const prevDayIndex = prevDay.getDay();

      // Todo Checking if it's data from DefaultWorkingHour not WorkingHour CalendarTimeperiod
      let isDataHaveDWHFromPrevDay = false;

      if (dwhSlotTimes[prevDayIndex].length > 1) {
        let i = 0;
        for (const prevDaySlotTime of dwhSlotTimes[prevDayIndex][0]) {
          if (includes(workingSlotTimes[prevDayKey], prevDaySlotTime)) i++;
        }
        let i2 = 0;
        for (const nextDaySlotTime of dwhSlotTimes[prevDayIndex][1]) {
          if (includes(workingSlotTimes[wtKey], nextDaySlotTime)) i2++;
        }
        // double check to make sure it's actually dwh (need to make sure this is correct way to check dwh)
        if (
          dwhSlotTimes[prevDayIndex][0].length == i &&
          dwhSlotTimes[prevDayIndex][1].length == i2
        ) {
          isDataHaveDWHFromPrevDay = true;
        }
      }

      // Todo if workingSlotTimes empty it's gonna add DefaultWorkingHour
      if (workingSlotTimes[wtKey].length == 0 || isDataHaveDWHFromPrevDay) {
        workingSlotTimes[wtKey] = union(workingSlotTimes[wtKey], dwhSlotTimes[dayIndex][0]);

        // Todo Add for Nextday
        if (dwhSlotTimes[dayIndex].length > 1) {
          const nextDay = new Date(addDay(wtKey, 1));
          const nextDayKey = formatDate(nextDay);
          workingSlotTimes[nextDayKey] = union(workingSlotTimes[nextDayKey], dwhSlotTimes[dayIndex][1]);
        }
      }
    }

    return workingSlotTimes;
  }

  async getSlotTime_(calendarId: string, locationId: string, from, to) {
    const dateFrom = new Date(
      from ? zeroTimes(subDay(from, 1)) : zeroTimes(new Date())
    ); // zeroTimes set all time to 00:00:00
    let dateTo = new Date(
      to
        ? zeroTimes(addDay(to, 1))
        : zeroTimes(new Date().setUTCDate(dateFrom.getDate() + 28))
    ); // 28 = 4 weeks

    const availableSlotTimes = [];
    const workingSlotTimes = {}; // calendarTimeperiod
    const blockedSlotTimes = {}; // calendarTimeperiod
    const divideBy = 5; // 5 minutes
    const maxSlotTime = new Date((await this.setting_.get('automation_max_slot_date_time')).value)

    if (dateTo > maxSlotTime) dateTo = maxSlotTime

    // making object for each day in working_hour
    for (let i = 0; i < countDays(dateFrom, dateTo); i++) {
      const dateCurr = addDay(dateFrom, i);
      const getKey = formatDate(dateCurr);
      workingSlotTimes[getKey] = [];
      blockedSlotTimes[getKey] = [];
    }

    const calendar = await this.calendar_.retrieve(calendarId, {})
    
    // other [note]
    // work_times [working_hour]
    // blocked_times [breaktime / blocked / off]

    // select working_time and blocked_time
    const blockedTimePeriods = await this.calendarTimeperiod_.list(
      {
        calendar_id: calendar.id,
        from: { gte: dateFrom, lte: dateTo },
        to: { gte: dateFrom, lte: dateTo },
        type: ["breaktime", "blocked", "off"],
      },
      { order: { from: "DESC" } }
    );
    const workingTimePeriods = await this.calendarTimeperiod_.list(
      {
        calendar_id: calendar.id,
        from: { gte: dateFrom, lte: dateTo },
        to: { gte: dateFrom, lte: dateTo },
        type: "working_hour",
      },
      { order: { from: "DESC" } }
    );

    // divide into hours by 5 minutes and day as key object

    // working time
    for (const workingTimePeriod of workingTimePeriods) {
      const resultDivide = divideTimes(
        workingTimePeriod.from,
        workingTimePeriod.to,
        divideBy
      );
      for (const dateEntry of Object.entries(resultDivide)) {
        const [dateKey, dateTimeList] = dateEntry;

        workingSlotTimes[dateKey] = union(
          workingSlotTimes[dateKey],
          // @ts-ignore
          dateTimeList
        );
      }
    }

    // blocked time
    for (const blockedTimePeriod of blockedTimePeriods) {
      const resultDivide = divideTimes(blockedTimePeriod.from, blockedTimePeriod.to, divideBy);
      for (const dateEntry of Object.entries(resultDivide)) {
        const [dateKey, dateTimeList] = dateEntry;

        blockedSlotTimes[dateKey] = union(
          blockedSlotTimes[dateKey],
          // @ts-ignore
          dateTimeList
        );
      }
    }

    // preparing and merge workingtimes with dwh
    const dwhSlotTimes = await this.defaultWorkingHour_.getDefaultWorkingHourSlotTimesByLocationId(locationId);
    const mergeDWHResult = this.mergeDefaultWorkingHourToWorkingSlotTimes(dwhSlotTimes, workingSlotTimes);

    // filter working time with blocked time and if there no day
    for (const workingSlotTime of Object.entries(mergeDWHResult)) {
      const [wtKey, wtTimeList] = workingSlotTime

      let availableObject = {
        date: wtKey,
        slot_times: [],
      };

      availableObject.slot_times = !blockedSlotTimes[wtKey]
        ? mergeDWHResult[wtKey]
        : (availableObject.slot_times = mergeDWHResult[wtKey].filter(
            (st) => !blockedSlotTimes[wtKey].includes(st)
          ));
      
      availableObject.slot_times.sort(); // sort the slot_times

      availableSlotTimes.push(availableObject);
    }

    return availableSlotTimes;
  }

  async getSlotTime(
    locationId: string,
    from?: Date,
    to?: Date,
    config?: Record<string, any>
  ) {
    let slotTimes = []

    const { calendar_id } = config

    const location = await this.retrieve(locationId, {
      relations: ["company", "calendars", "default_working_hour"],
    });

    // filter calendars with selection one if calendar_id not null
    if (calendar_id)
      location.calendars = location.calendars.filter(
        (item) => item.id == calendar_id
      );
    
    for (const calendar of location.calendars) {
      const getSlotTime_ = await this.getSlotTime_(calendar.id, locationId, from, to)
      let slotTimeObject = {
        ...calendar,
        available_times: getSlotTime_
      }
      slotTimes.push(slotTimeObject)
    }

    if (slotTimes.length == 1) slotTimes = slotTimes[0]

    return slotTimes
  }
}

export default LocationService;