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
  checkIfNextDay,
  countDays,
  divideTimes,
  formatDate,
  subDay,
  utcToSpecificTZ,
  zeroTimes,
} from "../utils/date-utils";
import { includes, union } from "lodash";
import DefaultWorkingHourService from "./default-working-hour";
import ServiceSettingService from "./service-setting";
import { SlotTimes } from "../types/appointment";

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
    serviceSettingService,
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
        workingSlotTimes[wtKey] = union(
          workingSlotTimes[wtKey],
          dwhSlotTimes[dayIndex][0]
        );

        // Todo Add for Nextday
        if (dwhSlotTimes[dayIndex].length > 1) {
          const nextDay = new Date(addDay(wtKey, 1));
          const nextDayKey = formatDate(nextDay);
          workingSlotTimes[nextDayKey] = union(
            workingSlotTimes[nextDayKey],
            dwhSlotTimes[dayIndex][1]
          );
        }
      }
    }

    return workingSlotTimes;
  }

  filterWithDurationV2(
    slotTimes: SlotTimes[],
    duration: number,
    divideBy: number
  ) {
    const requiredNumberOfConsecutiveBlocks = Math.ceil(duration / divideBy);

    return slotTimes.map((slotTime, slotTimeIndex) => {
      const { date, slot_times: slotTimesToDate } = slotTime;

      /**
       * Iterate through each date slotTimes value
       * date: 01-01-2023
       * slot_times: [10:00,10:05,10:10,...]
       */

      const slotTimesToDate_ = slotTimesToDate.filter((slotTime, index) => {
        // console.log("Main index", index);

        const maxBlockIndex = index + requiredNumberOfConsecutiveBlocks;
        // Not enough time until the end of day

        for (let index_ = index; index_ < maxBlockIndex; index_++) {
          if (!slotTimesToDate[index_ + 1]) return false;

          const current = slotTimesToDate[index_];
          const nextIsFromSameDay = !!slotTimesToDate[index_ + 1];

          const nextDay = slotTimes[slotTimeIndex + 1];

          // Check if next day is one day after the previous day

          if (!nextDay) return false;

          let nextTimeSlot = slotTimesToDate[index_ + 1];

          if (!nextIsFromSameDay) {
            // If there are no appointments in the next day
            if (nextDay.slot_times.length === 0) return false;

            const nextSlotTimeDate = nextDay.date;

            const isNextDay = checkIfNextDay(date, nextSlotTimeDate);

            if (!isNextDay) return false;

            nextTimeSlot = nextDay.slot_times[0];
          }

          const [currentHour, currentMinute] = current.split(":");
          const [nextHour, nextMinute] = nextTimeSlot.split(":");

          // If same hour
          const calculatedNextMinute = parseInt(currentMinute) + divideBy;
          const sameHour =
            parseInt(currentHour) === parseInt(nextHour) &&
            calculatedNextMinute === parseInt(nextMinute);

          if (!sameHour) return false;

          // If different hour
          const nextHourMinute = calculatedNextMinute % 60;

          const isNextConsecutiveMinute =
            parseInt(nextMinute) === nextHourMinute;
          if (!isNextConsecutiveMinute) return false;

          if (index + 1 === maxBlockIndex) return true;
        }

        return true;
      });

      return { date, slot_times: slotTimesToDate_ };
    });
  }

  filterWithDuration(slotTimes, duration, divideBy) {
    // Todo if duration 10 minutes, so every timeSlot should can be book for 10 minutes
    const slotNeeded = duration / divideBy;
    let howManyLoop = 0;

    // convert slotTimes
    const convertedSlotTimes = {};

    for (const slotTime of slotTimes) {
      //@ts-ignore
      convertedSlotTimes[slotTime.date] = slotTime.slot_times;
    }

    const timeSlotNeeded = {};

    for (const slotTime of Object.entries(convertedSlotTimes)) {
      const [slotTimeKey, slotTimeData] = slotTime;
      timeSlotNeeded[slotTimeKey] = {};

      for (const time of slotTimeData) {
        timeSlotNeeded[slotTimeKey][time] = [];
        const [currentHour, currentMinute] = time
          .split(":")
          .map((x) => parseInt(x));
        for (let i = 0; i < slotNeeded; i++) {
          const currDate = new Date(slotTimeKey);
          currDate.setUTCHours(currentHour);
          currDate.setUTCMinutes(currentMinute + i * divideBy);

          const hoursUTC = currDate.getUTCHours();
          const minutesUTC = currDate.getUTCMinutes();
          const hours = hoursUTC < 10 ? `0${hoursUTC}` : hoursUTC;
          const minutes = minutesUTC < 10 ? `0${minutesUTC}` : minutesUTC;

          timeSlotNeeded[slotTimeKey][time].push(`${hours}:${minutes}`);
          howManyLoop++;
        }
      }
    }

    const availableSlotTimesWithDuration = {};

    // Todo Checking the slot
    for (const [tsnKey, tsnValue] of Object.entries(timeSlotNeeded)) {
      availableSlotTimesWithDuration[tsnKey] = [];

      // Getting next day key
      let tsnKeyNext: any = new Date(tsnKey);
      tsnKeyNext.setDate(tsnKeyNext.getDate() + 1);
      const month = tsnKeyNext.getMonth() + 1;
      const date = tsnKeyNext.getDate();
      tsnKeyNext = `${tsnKeyNext.getFullYear()}-${
        month < 10 ? `0` + month : month
      }-${date < 10 ? `0` + date : date}`;

      for (const [tsnChildKey, tsnChildValue] of Object.entries(tsnValue)) {
        let countSlot = 0;
        let isNextDay = false;
        for (const indx in tsnChildValue) {
          const [currHour, currMinute] = tsnChildValue[indx].split(":");
          const [prevHour, prevMinute] =
            indx != "0"
              ? tsnChildValue[indx - 1].split(":")
              : [currHour - 1, 0];

          // Todo check today or tomorrow?
          if (prevHour > currHour) isNextDay = true;

          if (!isNextDay) {
            if (convertedSlotTimes[tsnKey].includes(tsnChildValue[indx]))
              countSlot++;
          } else {
            if (
              convertedSlotTimes[tsnKeyNext] &&
              convertedSlotTimes[tsnKeyNext].includes(tsnChildValue[indx])
            )
              countSlot++;
          }
        }
        if (countSlot === slotNeeded)
          availableSlotTimesWithDuration[tsnKey].push(tsnChildKey);
      }
    }

    const convertToOriginalStyle = [];

    for (const availableSlotTime of Object.entries(
      availableSlotTimesWithDuration
    )) {
      const [astKey, astData] = availableSlotTime;
      convertToOriginalStyle.push({
        date: astKey,
        slot_times: astData,
      });
    }

    return convertToOriginalStyle;
  }

  async getSlotTime_(
    calendarId: string,
    locationId: string,
    from,
    to,
    config: Record<string, any> = {}
  ) {
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
    const maxSlotTime = new Date(
      (await this.setting_.get("automation_max_slot_date_time")).value
    );

    const { duration, timezone } = config;

    if (dateTo > maxSlotTime) dateTo = maxSlotTime;

    // making object for each day in working_hour
    for (let i = 0; i < countDays(dateFrom, dateTo); i++) {
      const dateCurr = addDay(dateFrom, i);
      const getKey = formatDate(dateCurr);
      workingSlotTimes[getKey] = [];
      blockedSlotTimes[getKey] = [];
    }

    const calendar = await this.calendar_.retrieve(calendarId, {});

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
      const resultDivide = divideTimes(
        blockedTimePeriod.from,
        blockedTimePeriod.to,
        divideBy
      );
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
    const dwhSlotTimes =
      await this.defaultWorkingHour_.getDefaultWorkingHourSlotTimesByLocationId(
        locationId
      );
    const mergeDWHResult = this.mergeDefaultWorkingHourToWorkingSlotTimes(
      dwhSlotTimes,
      workingSlotTimes
    );

    // filter working time with blocked time and if there no day
    for (const workingSlotTime of Object.entries(mergeDWHResult)) {
      const [wtKey, wtTimeList] = workingSlotTime;

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

    let availableSlotTimesFinal = []

    // convert utc slot time to specific timezone, should be optimized later!
    if (timezone) {
      const collectionSlotTime = {}
      for (const availableSlotTime of availableSlotTimes) {
        for (const slotTime of availableSlotTime.slot_times) {
          const newDate = new Date(availableSlotTime.date)
          const [newHour, newMinute] = slotTime.split(":").map((x) => parseInt(x))
          newDate.setUTCHours(newHour, newMinute)
          const newTZ = utcToSpecificTZ(newDate, timezone)
          const newKey = `${newTZ.date.year}-${newTZ.date.month}-${newTZ.date.day}`;
          const newSlotTime = `${newTZ.time.hour}:${newTZ.time.minute}`;
          if (!collectionSlotTime[newKey]) collectionSlotTime[newKey] = []
          collectionSlotTime[newKey].push(newSlotTime)
        }
      }

      for (const collSlotTime of Object.entries(collectionSlotTime)) {
        const [key, value] = collSlotTime;
        availableSlotTimesFinal.push({
          date: key,
          slot_times: value
        })
      }
    } else {
      // if timezone is undefined then we use utc timezone which is already there.
      availableSlotTimesFinal = availableSlotTimes;
    }

    if (duration)
      return this.filterWithDurationV2(availableSlotTimesFinal, duration, divideBy);

    return availableSlotTimes;
  }

  async getSlotTime(
    locationId: string,
    from?: Date,
    to?: Date,
    config?: Record<string, any>
  ) {
    let slotTimes = [];

    const { calendar_id, duration, timezone } = config

    const location = await this.retrieve(locationId, {
      relations: ["company", "calendars", "default_working_hour"],
    });

    // filter calendars with selection one if calendar_id not null
    if (calendar_id)
      location.calendars = location.calendars.filter(
        (item) => item.id == calendar_id
      );

    for (const calendar of location.calendars) {
      const getSlotTime_ = await this.getSlotTime_(
        calendar.id,
        locationId,
        from,
        to,
        { duration: duration }
      );
      let slotTimeObject = {
        ...calendar,
        available_times: getSlotTime_,
      };
      slotTimes.push(slotTimeObject);
    }

    return slotTimes;
  }
}

export default LocationService;
