import { z } from "zod";

export const PresignImageSchema = z
  .object({
    filename: z.string().trim().min(1).max(200),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
  })
  .strict()
  .refine(
    (data) => {
      switch (data.contentType) {
        case "image/jpeg":
          return /\.jpe?g$/i.test(data.filename);
        case "image/png":
          return /\.png$/i.test(data.filename);
        case "image/webp":
          return /\.webp$/i.test(data.filename);
        default:
          return false;
      }
    },
    {
      message: "Đuôi file không khớp với loại ảnh",
      path: ["filename"],
    },
  );

export type PresignImageRequest = z.infer<typeof PresignImageSchema>;

export const ConfirmImageSchema = z
  .object({
    key: z.string().trim().min(1).max(250),
  })
  .strict();

export type ConfirmImageRequest = z.infer<typeof ConfirmImageSchema>;
