import { z } from "zod";
import {
  BUSINESS_TYPES,
  MODULE_OPTIONS,
  SIGNUP_REQUIRED_MODULES_CAFE,
  SIGNUP_REQUIRED_MODULES_LODGING,
} from "@/constants/signup";
import {
  isBusinessTypeComingSoon,
  isModuleComingSoon,
  isModuleDisabledAtSignup,
  normalizeSignupModules,
} from "@/lib/signup/subscriptionModules";

const businessTypeEnum = z.enum(BUSINESS_TYPES, {
  message: "Please select the business type",
});
const moduleEnum = z.enum(MODULE_OPTIONS, {
  message: "Please select modules",
});

export const ApexCreateTenantSchema = z
  .object({
    HotelName: z.string().min(1, "Business name is required"),
    LogoUrl: z.string().min(2, "Please upload the business logo"),
    UserName: z.string().trim().min(2, "Username is required"),
    Password: z.string().min(6, "Password must be at least 6 characters"),
    tinNumber: z
      .string()
      .refine(
        (s) => {
          const t = s.trim();
          return t === "" || /^\d{10}$/.test(t);
        },
        {
          message:
            "TIN must be exactly 10 digits, or leave blank for a server-assigned id",
        },
      ),
    type: businessTypeEnum,
    modules: z.array(moduleEnum).min(1, "Please select at least one module"),
  })
  .superRefine((data, ctx) => {
    if (isBusinessTypeComingSoon(data.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.type} registration is coming soon. Choose Café and Restaurant or Hotel.`,
        path: ["type"],
      });
      return;
    }

    const selected = new Set(data.modules);

    if (data.type === "Cafe and Restaurant") {
      for (const req of SIGNUP_REQUIRED_MODULES_CAFE) {
        if (!selected.has(req)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Cafe registration must include "${req}"`,
            path: ["modules"],
          });
        }
      }
    } else {
      for (const req of SIGNUP_REQUIRED_MODULES_LODGING) {
        if (!selected.has(req)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Lodging registration must include "${req}"`,
            path: ["modules"],
          });
        }
      }
    }

    for (const mod of data.modules) {
      if (isModuleComingSoon(mod)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${mod}" is not available yet`,
          path: ["modules"],
        });
      }
      if (
        isModuleDisabledAtSignup(mod, data.type) &&
        !SIGNUP_REQUIRED_MODULES_CAFE.includes(
          mod as (typeof SIGNUP_REQUIRED_MODULES_CAFE)[number],
        ) &&
        !SIGNUP_REQUIRED_MODULES_LODGING.includes(
          mod as (typeof SIGNUP_REQUIRED_MODULES_LODGING)[number],
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${mod}" cannot be selected for this business type`,
          path: ["modules"],
        });
      }
    }

    normalizeSignupModules(data.type, data.modules);
  });

export type ApexCreateTenantFormValues = z.infer<typeof ApexCreateTenantSchema>;
