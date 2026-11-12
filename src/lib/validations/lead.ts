
import { z } from "zod";

/**
 * Normalize a US ZIP code.
 */
export const zipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "ZIP code must contain exactly 5 digits");

/**
 * Public website lead submission.
 *
 * companySlug identifies the tenant.
 * The API will resolve it against the companies table.
 */
export const createLeadSchema = z.object({
  companySlug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Invalid company slug",
    ),

  customer: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(25),

    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .optional()
      .or(z.literal("")),
  }),

  serviceAddress: z.object({
    addressLine1: z.string().trim().min(1).max(255),
    addressLine2: z.string().trim().max(255).optional(),

    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(2).max(100),

    zipCode: zipCodeSchema,

    countryCode: z
      .string()
      .trim()
      .length(2)
      .default("US"),
  }),

  service: z.object({
    type: z.string().trim().min(2).max(100),

    description: z
      .string()
      .trim()
      .min(5)
      .max(4000),
  }),
});

export type CreateLeadInput = z.infer<
  typeof createLeadSchema
>;
