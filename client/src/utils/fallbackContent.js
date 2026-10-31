// Used only when the API can't be reached; normal copy always comes from the CMS.
export const fallbackSections = {
  navbar: {
    key: 'navbar',
    content: {
      ctaLabel: 'Enquire Now',
      links: [
        { label: 'Home', href: '#home' },
        { label: 'About Project', href: '#about' },
        { label: 'Connectivity', href: '#connectivity' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Amenities', href: '#amenities' },
        { label: 'Floor Plans', href: '#floor-plans' },
        { label: 'Developer', href: '#developer' },
        { label: 'Contact', href: '#contact' },
      ],
    },
  },
  hero: {
    key: 'hero',
    title: 'one',
    subtitle: 'Where home extends to life.',
    image: '',
    content: {
      location: 'Subhash Nagar, Chembur, Mumbai',
      codename: 'Codename',
      projectName: 'one',
      projectSuffix: 'Chembur',
      primaryCta: { label: 'Explore the Project', href: '#about' },
      secondaryCta: { label: 'Enquire Now', action: 'enquire' },
    },
  },
  about: {
    key: 'about',
    title: 'A Legacy Built for the Future',
    subtitle: 'About the Project',
    image: '',
    body: 'Residential redevelopment in Subhash Nagar, Chembur, offering 1 & 2 BHK residences with lifestyle amenities.',
    content: {
      highlights: [],
      stats: [],
      brochureCta: { label: 'Download Brochure', url: '' },
    },
  },
};
