import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const itemsSchema = z
  .array(z.object({ partId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }))
  .max(60);

export const listPartsFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        asOf: isoDate,
        search: z.string().max(120).optional(),
        category: z.string().max(60).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { listParts } = await import("./pricing/service.server");
    return listParts(data);
  });

export const getPartFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), asOf: isoDate }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getPart } = await import("./pricing/service.server");
    return getPart(data);
  });

export const createPartFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(2).max(80),
        category: z.string().min(2).max(40),
        description: z.string().max(240).optional(),
        price: z.number().min(0).max(1_000_000),
        effectiveFrom: isoDate,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createPart } = await import("./pricing/service.server");
    return createPart(data);
  });

export const setPartStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["ACTIVE", "INACTIVE"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { setPartStatus } = await import("./pricing/service.server");
    return setPartStatus(data);
  });

export const addPartPriceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        partId: z.string().uuid(),
        price: z.number().min(0).max(1_000_000),
        effectiveFrom: isoDate,
        note: z.string().max(160).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { addPartPrice } = await import("./pricing/service.server");
    return addPartPrice(data);
  });

export const listConfigurationsFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        asOf: isoDate,
        type: z.enum(["PREDEFINED", "CUSTOM", "ALL"]).optional(),
        search: z.string().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { listConfigurations } = await import("./pricing/service.server");
    return listConfigurations(data);
  });

export const getConfigurationFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), asOf: isoDate }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getConfiguration } = await import("./pricing/service.server");
    return getConfiguration(data);
  });

export const calculateBreakdownFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ items: itemsSchema, asOf: isoDate }).parse(data))
  .handler(async ({ data }) => {
    const { calculateBreakdown } = await import("./pricing/service.server");
    return calculateBreakdown(data);
  });

export const saveConfigurationFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2).max(80),
        description: z.string().max(240).optional(),
        type: z.enum(["PREDEFINED", "CUSTOM"]),
        derivedFromId: z.string().uuid().nullable().optional(),
        items: itemsSchema.min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { saveConfiguration } = await import("./pricing/service.server");
    return saveConfiguration(data);
  });

export const deleteConfigurationFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { deleteConfiguration } = await import("./pricing/service.server");
    return deleteConfiguration(data);
  });

export const listPriceChangesFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ asOf: isoDate }).parse(data))
  .handler(async ({ data }) => {
    const { listPriceChanges } = await import("./pricing/service.server");
    return listPriceChanges(data);
  });

export const getPriceImpactFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        asOf: isoDate,
        partId: z.string().uuid().optional(),
        effectiveFrom: isoDate.optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getPriceImpact } = await import("./pricing/service.server");
    return getPriceImpact(data);
  });

export const getDashboardFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ asOf: isoDate }).parse(data))
  .handler(async ({ data }) => {
    const { getDashboard } = await import("./pricing/service.server");
    return getDashboard(data);
  });
