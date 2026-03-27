/** Dispatched after content save so shell can reload logo from API. */
export const CMS_BRANDING_REFRESH_EVENT = 'cms-branding-refresh';

export function dispatchBrandingRefresh(): void {
  window.dispatchEvent(new Event(CMS_BRANDING_REFRESH_EVENT));
}
