// Sections the page renders with dedicated components. Any other published section is a "custom section":
// created in the admin, rendered generically (see components/sections/CustomSections.jsx).
export const BUILT_IN_SECTION_KEYS = [
  'navbar', 'hero', 'about', 'connectivity', 'gallery', 'amenities', 'video', 'floorPlans', 'rera', 'developer', 'cta', 'footer',
];

export const isBuiltInSection = (key) => BUILT_IN_SECTION_KEYS.includes(key);

// DOM id used for a custom section, so links like #section-<key> work and can never clash with built-in ids
export const customSectionId = (key) => `section-${key}`;
