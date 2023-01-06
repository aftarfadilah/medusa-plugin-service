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

type InjectedDependencies = {
  manager: EntityManager;
  locationRepository: typeof LocationRepository;
  eventBusService: EventBusService;
  calendarService: CalendarService;
  calendarTimeperiodService: CalendarTimeperiodService;
};

class LocationService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  protected readonly locationRepository_: typeof LocationRepository;
  protected readonly eventBus_: EventBusService;
  protected readonly calendar_: CalendarService;
  protected readonly calendarTimeperiod_: CalendarTimeperiodService;

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
  }: InjectedDependencies) {
    super(arguments[0]);

    this.manager_ = manager;
    this.locationRepository_ = locationRepository;
    this.eventBus_ = eventBusService;
    this.calendar_ = calendarService;
    this.calendarTimeperiod_ = calendarTimeperiodService;
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

  // Todo Merge DWH and empty WorkingTimes
  doDWH(dwhList, workingTimes) {
    const wt = workingTimes;
    // Todo collecting divide times dwh in 1 week
    const dwhCollection = [];
    for (const x of dwhList) {
      const dateCurr = new Date(1000 * 24 * 60 * 60 * (3 * (x.day + 1)));
      const dayIndex = dateCurr.getDay();
      const dwh = dwhList[dayIndex];
      const fromTime = dwh.from.split(":");
      const toTime = dwh.to.split(":");
      const isWorkingDay = dwh.is_working_day || false;
      const fromX = new Date(dateCurr);
      let toX = new Date(dateCurr);
      fromX.setUTCHours(fromTime[0], fromTime[1], fromTime[2]);
      toX.setUTCHours(toTime[0], toTime[1], toTime[2]);

      // Todo If `from` time more than `to` time than, we should add 1 day in `to`
      if (fromX.getTime() > toX.getTime()) {
        toX = addDay(toX, 1);
      }

      dwhCollection[dayIndex] = [];

      if (isWorkingDay) {
        const resultDivide = divideTimes(fromX, toX, 5);
        let ix = 0;

        for (const dateEntry in Object.entries(resultDivide)) {
          const [dateKey, dateTimeList] = dateEntry;

          dwhCollection[dayIndex][ix] = resultDivide[dateKey];
          ix++;
        }
      }
    }

    for (const x in wt) {
      const dayIndex = new Date(x).getDay();

      const prevDay = new Date(subDay(x, 1));
      const prevDayKey = formatDate(prevDay);
      const prevDayIndex = prevDay.getDay();
      let isDataHaveDWHFromPrevDay = false;

      if (dwhCollection[prevDayIndex].length > 1) {
        let i = 0;
        for (const xx of dwhCollection[prevDayIndex][0]) {
          if (includes(wt[prevDayKey], xx)) i++;
        }
        let i2 = 0;
        for (const xx of dwhCollection[prevDayIndex][1]) {
          if (includes(wt[x], xx)) i2++;
        }
        // double check to make sure it's actually dwh (need to make sure this is correct way to check dwh)
        if (
          dwhCollection[prevDayIndex][0].length == i &&
          dwhCollection[prevDayIndex][1].length == i2
        ) {
          isDataHaveDWHFromPrevDay = true;
        }
      }

      if (wt[x].length == 0 || isDataHaveDWHFromPrevDay) {
        wt[x] = union(wt[x], dwhCollection[dayIndex][0]);

        // Todo Add for Nextday
        if (dwhCollection[dayIndex].length > 1) {
          const nextDay = new Date(addDay(x, 1));
          const nextDayKey = formatDate(nextDay);
          wt[nextDayKey] = union(wt[nextDayKey], dwhCollection[dayIndex][1]);
        }
      }
    }

    return wt;
  }

  async getSlotTime(
    locationId: string,
    from?: Date,
    to?: Date,
    config?: Record<string, any>
  ) {
    const dateFrom = new Date(
      from ? zeroTimes(subDay(from, 1)) : zeroTimes(new Date())
    ); // zeroTimes set all time to 00:00:00
    const dateTo = new Date(
      to
        ? zeroTimes(addDay(to, 1))
        : zeroTimes(new Date().setUTCDate(dateFrom.getDate() + 28))
    ); // 28 = 4 weeks
    const availableTimes = [];
    const workingTimes = [];
    const blockedTimes = [];
    const divideBy = 5; // 5 minutes

    const { calendar_id } = config;

    // other [note]
    // work_times [working_hour]
    // blocked_times [breaktime / blocked / off]

    const location = await this.retrieve(locationId, {
      relations: ["company", "calendars", "default_working_hour"],
    });

    /**
     * TODO: Integrate maximum_available_timeslot here
     *  Instead of countDays(from-to) do (from-maximumAvailableTimeslotDate)
     */

    // making object for each day in working_hour
    for (let i = 0; i < countDays(dateFrom, dateTo); i++) {
      const dateCurr = addDay(dateFrom, i);
      const getKey = formatDate(dateCurr);
      workingTimes[getKey] = [];
      blockedTimes[getKey] = [];
    }

    // filter calendars with selection one if calendar_id not null
    if (calendar_id)
      location.calendars = location.calendars.filter(
        (item) => item.id == calendar_id
      );
    // get all connection calendar from location and collection blocked and working times
    for (const calendar of location.calendars) {
      // select working_time and blocked_time
      const blockedTimePeriodList = await this.calendarTimeperiod_.list(
        {
          calendar_id: calendar.id,
          from: { gte: dateFrom, lte: dateTo },
          to: { gte: dateFrom, lte: dateTo },
          type: ["breaktime", "blocked", "off"],
        },
        { order: { from: "DESC" } }
      );
      const workingTimePeriodList = await this.calendarTimeperiod_.list(
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
      for (const workingTimePeriod of workingTimePeriodList) {
        const resultDivide = divideTimes(
          workingTimePeriod.from,
          workingTimePeriod.to,
          divideBy
        );
        for (const dateEntry in Object.entries(resultDivide)) {
          const [dateKey, dateTimeList] = dateEntry;

          workingTimes[dateKey] = union(
            workingTimes[dateKey],
            resultDivide[dateKey]
          );
        }
      }

      // blocked time
      for (const x of blockedTimePeriodList) {
        const resultDivide = divideTimes(x.from, x.to, divideBy);
        for (const dateEntry in Object.entries(resultDivide)) {
          const [dateKey, dateTimeList] = dateEntry;

          blockedTimes[dateKey] = union(
            blockedTimes[dateKey],
            resultDivide[dateKey]
          );
        }
      }
    }

    // preparing and merge workingtimes with dwh
    const dwhList = [];
    location.default_working_hour.map((dwh) => (dwhList[dwh.day] = dwh));
    const wtDWH = this.doDWH(dwhList, workingTimes);

    // filter working time with blocked time and if there no day
    for (const x in wtDWH) {
      let pushNow = {
        date: x,
        slot_times: [],
      };

      pushNow.slot_times = !blockedTimes[x]
        ? wtDWH[x]
        : (pushNow.slot_times = wtDWH[x].filter(
            (item) => !blockedTimes[x].includes(item)
          ));
      pushNow.slot_times.sort();
      availableTimes.push(pushNow);
    }

    return availableTimes;
  }
}

export default LocationService;
