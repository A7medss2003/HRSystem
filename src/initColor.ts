export function initThemeColor() {
  let savedColor = localStorage.getItem('app_primary_color');
  if (savedColor === '#2563eb') {
    savedColor = '#243f63';
    localStorage.setItem('app_primary_color', savedColor);
  }
  if (savedColor) {
    document.documentElement.style.setProperty('--color-primary', savedColor);
    document.documentElement.style.setProperty('--color-primary-light', savedColor + '20'); 
    document.documentElement.style.setProperty('--color-primary-hover', savedColor + 'E6'); 
  }
}
