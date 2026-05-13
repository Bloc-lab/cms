import type { ContentConfig } from './types.js';
import { archCmsConfig } from './arch-cms-config.js';
import { flattenSitePagesFields, type SitePagesConfigMap } from './site-pages.js';

function partitionArchSitePages(): SitePagesConfigMap {
  const main: ContentConfig = {};
  const about: ContentConfig = {};
  const pricingPage: ContentConfig = {};
  const contactPage: ContentConfig = {};

  for (const [fullKey, field] of Object.entries(archCmsConfig)) {
    if (fullKey.startsWith('admin.')) continue;
    if (fullKey.startsWith('about.')) {
      about[fullKey] = field;
    } else if (fullKey.startsWith('pricingPage.')) {
      pricingPage[fullKey.slice('pricingPage.'.length)] = field;
    } else if (fullKey.startsWith('contactPage.')) {
      contactPage[fullKey.slice('contactPage.'.length)] = field;
    } else {
      main[fullKey] = field;
    }
  }

  return {
    main: { slug: '', label: 'Domů', fields: main },
    about: { slug: 'o-nas', label: 'O nás', fields: about },
    pricingPage: { slug: 'cenik', label: 'Ceník', fields: pricingPage },
    contactPage: { slug: 'kontakt', label: 'Kontakt', fields: contactPage },
  };
}

export const archSitePagesConfig = partitionArchSitePages();

/** `main:hero.title`, `pricingPage:hero.badge`, … */
export const archSiteContentConfig = flattenSitePagesFields(archSitePagesConfig);
