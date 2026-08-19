import { z } from 'zod';

export const employeeSchema = z.object({
  fullName: z.string().min(3, 'الاسم الرباعي يجب أن يكون 3 أحرف على الأقل'),
  jobTitle: z.string().min(2, 'المسمى الوظيفي مطلوب'),
  company: z.string().min(2, 'الشركة/المؤسسة مطلوبة'),
  workEmail: z.string().email('البريد الإلكتروني للعمل غير صالح').or(z.literal('')),
  workPhone: z.string().regex(/^[0-9+]*$/, 'رقم هاتف العمل يجب أن يحتوي على أرقام فقط').or(z.literal('')),
  workMobile: z.string().regex(/^[0-9+]*$/, 'رقم الجوال يجب أن يحتوي على أرقام فقط').or(z.literal('')),
  personalEmail: z.string().email('البريد الإلكتروني الشخصي غير صالح').or(z.literal('')),
  personalPhone: z.string().regex(/^[0-9+]*$/, 'رقم الهاتف الشخصي يجب أن يحتوي على أرقام فقط').or(z.literal('')),
  department: z.string().min(2, 'القسم مطلوب'),
  management: z.string().min(2, 'الإدارة مطلوبة'),
  nationalId: z.string().regex(/^[0-9]*$/, 'الرقم الوطني يجب أن يحتوي على أرقام فقط').min(10, 'الرقم الوطني يجب أن لا يقل عن 10 أرقام').or(z.literal('')),
});
