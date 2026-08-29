export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل';
  if (!/[a-zA-Z]/.test(password)) return 'يجب أن تحتوي كلمة المرور على حرف إنجليزي واحد على الأقل';
  if (!/[0-9]/.test(password)) return 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل';
  return null;
};
