/**
 * Zod validation schemas for API requests and responses
 */

import { z } from "zod";

// Pass-related schemas
export const CreatePassSchema = z.object({});

export const ClaimPassSchema = z.object({
  token: z.string().min(32).max(128),
});

export const IssueQRTokenSchema = z.object({
  pass_id: z.string().uuid(),
});

export const RedeemPassSchema = z.object({
  qr_token: z.string(),
  device_id: z.string().min(1).max(255),
});

// Stripe schemas
export const StripeInitSubscriptionSchema = z.object({
  plan_id: z.string().uuid(),
});

// Staff schemas
export const StaffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Auth header parsing
export const AuthHeaderSchema = z.object({
  authorization: z.string().startsWith("Bearer "),
});

// Admin schemas
export const UpdatePlanSchema = z.object({
  plan_id: z.string().uuid(),
  passes_per_period: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
});

export const BanUserSchema = z.object({
  user_id: z.string().uuid(),
  is_banned: z.boolean(),
});

export const RevokePassSchema = z.object({
  pass_id: z.string().uuid(),
});

export const CreateStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["scanner", "admin"]),
});

export const DisableStaffSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.boolean(),
});

// Infer TypeScript types from schemas
export type CreatePassInput = z.infer<typeof CreatePassSchema>;
export type ClaimPassInput = z.infer<typeof ClaimPassSchema>;
export type IssueQRTokenInput = z.infer<typeof IssueQRTokenSchema>;
export type RedeemPassInput = z.infer<typeof RedeemPassSchema>;
export type StripeInitSubscriptionInput = z.infer<
  typeof StripeInitSubscriptionSchema
>;
export type StaffLoginInput = z.infer<typeof StaffLoginSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;
export type RevokePassInput = z.infer<typeof RevokePassSchema>;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type DisableStaffInput = z.infer<typeof DisableStaffSchema>;
