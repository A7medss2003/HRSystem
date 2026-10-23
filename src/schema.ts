import { z } from 'zod';

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب ولا يمكن تركه فارغاً'),
  jobTitle: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  workEmail: z.string().email('البريد الإلكتروني للعمل غير صالح').or(z.literal('')).optional(),
  workPhone: z.string().regex(/^[0-9+]*$/, 'رقم هاتف العمل يجب أن يحتوي على أرقام فقط').or(z.literal('')).optional(),
  workMobile: z.string().regex(/^[0-9+]*$/, 'رقم الجوال يجب أن يحتوي على أرقام فقط').or(z.literal('')).optional(),
  personalEmail: z.string().email('البريد الإلكتروني الشخصي غير صالح').or(z.literal('')).optional(),
  personalPhone: z.string().regex(/^[0-9+]*$/, 'رقم الهاتف الشخصي يجب أن يحتوي على أرقام فقط').or(z.literal('')).optional(),
  department: z.string().optional().or(z.literal('')),
  management: z.string().optional().or(z.literal('')),
  nationalId: z.string().regex(/^[0-9]*$/, 'الرقم الوطني يجب أن يحتوي على أرقام فقط').or(z.literal('')).optional(),
  bankName: z.string().optional().or(z.literal('')),
  bankBranch: z.string().optional().or(z.literal('')),
  bankAccountNumber: z.string().optional().or(z.literal('')),
  bankIban: z.string().optional().or(z.literal('')),
  bankAccountHolder: z.string().optional().or(z.literal('')),
  bankSwift: z.string().optional().or(z.literal('')),
  bankAccountType: z.string().optional().or(z.literal('')),
  bankCurrency: z.string().optional().or(z.literal('')),
  bankNotes: z.string().optional().or(z.literal('')),
});
