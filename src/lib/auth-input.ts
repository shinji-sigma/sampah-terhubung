import { z } from "zod";
const credentials = {
  email: z.email(),
  password: z.string().min(1, "Isi password.").max(128),
};
export const authInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("logout") }),
  z.object({ action: z.literal("login"), ...credentials }),
  z.object({
    action: z.literal("signup"),
    ...credentials,
    password: z
      .string()
      .min(12, "Password pendaftaran minimal 12 karakter.")
      .max(128),
    display_name: z.string().trim().min(3).max(80),
  }),
]);
