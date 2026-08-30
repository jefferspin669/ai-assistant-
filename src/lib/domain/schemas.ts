import { z } from "zod";

export const customerStatusSchema = z.enum(["lead", "active", "inactive"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "blocked", "completed"]);
export const taskPrioritySchema = z.enum(["low", "normal", "high"]);
export const eventPrioritySchema = z.enum(["low", "normal", "high"]);
export const transactionKindSchema = z.enum(["income", "expense"]);

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).optional(),
  status: customerStatusSchema.optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  notes: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.string().nullable().optional(),
  category: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createCalendarEventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  timezone: z.string().optional(),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  assignee: z.string().optional(),
  priority: eventPrioritySchema.optional(),
  reminderTime: z.string().nullable().optional(),
  customerId: z.string().min(1).optional(),
});

export const createTransactionSchema = z.object({
  kind: transactionKindSchema,
  label: z.string().trim().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
  date: z.string().min(1),
});

export const atlasActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CREATE_TASK"),
    payload: z.object({
      title: z.string().trim().min(1),
      dueDate: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("UPDATE_TASK"),
    payload: z.object({
      taskId: z.string().min(1),
      title: z.string().trim().min(1).optional(),
      status: taskStatusSchema.optional(),
      dueDate: z.string().nullable().optional(),
    }),
  }),
  z.object({
    type: z.literal("CREATE_APPOINTMENT"),
    payload: z.object({
      customerId: z.string().min(1),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      title: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("MOVE_APPOINTMENT"),
    payload: z.object({
      eventId: z.string().min(1),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal("CREATE_CUSTOMER"),
    payload: z.object({
      name: z.string().trim().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("SEND_MESSAGE"),
    payload: z.object({
      customerId: z.string().min(1),
      message: z.string().trim().min(1),
    }),
  }),
  z.object({
    type: z.literal("CREATE_QUOTE"),
    payload: z.object({
      customerId: z.string().min(1),
      amount: z.number().positive(),
    }),
  }),
  z.object({
    type: z.literal("REQUEST_PAYMENT"),
    payload: z.object({
      customerId: z.string().min(1),
      amount: z.number().positive(),
    }),
  }),
  z.object({
    type: z.literal("REFUND_CUSTOMER"),
    payload: z.object({
      customerId: z.string().min(1),
      amount: z.number().positive(),
    }),
  }),
]);

export type AtlasAction = z.infer<typeof atlasActionSchema>;

export function parseAtlasAction(input: unknown): AtlasAction {
  return atlasActionSchema.parse(input);
}
