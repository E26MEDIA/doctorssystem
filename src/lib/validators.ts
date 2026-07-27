import { z } from "zod";

export const appointmentSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Enter a valid phone number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  service: z.string().min(1, "Choose a service"),
  visitType: z.string().trim().min(1).max(80).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message is too short").max(2000),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});
