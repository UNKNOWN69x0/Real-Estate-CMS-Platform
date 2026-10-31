/*
 * One config object drives the whole section editor: every text, link, image, list item and stat
 * stored in Section.content is declared here. Field syntax is documented in components/admin/formUtils.js.
 * To make a new piece of CMS content editable, add a field here — no component changes needed.
 */

const text = (name, label, extra = {}) => ({ name, label, type: 'text', ...extra });
const textarea = (name, label, extra = {}) => ({ name, label, type: 'textarea', ...extra });
const url = (name, label, extra = {}) => ({ name, label, type: 'url', ...extra });
const image = (name, label, extra = {}) => ({ name, label, type: 'image', ...extra });

const link = (name, label) => ({
  name,
  label,
  type: 'group',
  fields: [text('label', 'Button label'), url('href', 'Link')],
});

const linkWithFile = (name, label) => ({
  name,
  label,
  type: 'group',
  fields: [text('label', 'Button label'), { name: 'url', label: 'PDF / link (leave empty to open the enquiry form)', type: 'file', accept: 'application/pdf' }],
});

const office = (name, label) => ({
  name,
  label,
  type: 'group',
  fields: [
    text('heading', 'Heading'),
    textarea('address', 'Address', { rows: 3 }),
    { name: 'phones', label: 'Phone numbers', type: 'strings', itemLabel: 'Phone', addLabel: 'Add phone' },
    text('email', 'Email'),
  ],
});

const linkList = (name, label) => ({
  name,
  label,
  type: 'list',
  itemLabel: 'Link',
  addLabel: 'Add link',
  inline: true,
  fields: [text('label', 'Label'), url('href', 'Link')],
});

export const sectionConfigs = {
  navbar: {
    label: 'Navbar',
    description: 'Top navigation links and the Enquire button label.',
    fields: [
      text('title', 'Brand name'),
      text('content.ctaLabel', 'Enquire button label'),
      linkList('content.links', 'Menu links'),
    ],
  },
  hero: {
    label: 'Hero',
    description: 'The first screen: project name, tagline, background image and buttons.',
    fields: [
      text('content.location', 'Location line'),
      text('content.codename', 'Codename label'),
      text('content.projectName', 'Project name (large)'),
      text('content.projectSuffix', 'Project suffix'),
      text('subtitle', 'Tagline'),
      image('image', 'Background image'),
      link('content.primaryCta', 'Primary button'),
      { name: 'content.secondaryCta', label: 'Secondary button (opens the enquiry form)', type: 'group', fields: [text('label', 'Button label')] },
    ],
  },
  about: {
    label: 'About',
    description: 'About the project: copy, highlights, stat cards and brochure.',
    fields: [
      text('subtitle', 'Eyebrow'),
      text('title', 'Heading', { required: true }),
      textarea('body', 'Description', { rows: 6 }),
      { name: 'content.highlights', label: 'Highlights', type: 'strings', itemLabel: 'Highlight', addLabel: 'Add highlight' },
      {
        name: 'content.stats',
        label: 'Stat cards',
        type: 'list',
        itemLabel: 'Stat',
        addLabel: 'Add stat',
        inline: true,
        fields: [text('value', 'Value', { required: true }), text('label', 'Label', { required: true })],
      },
      image('image', 'Building photo'),
      linkWithFile('content.brochureCta', 'Brochure button'),
    ],
  },
  connectivity: {
    label: 'Connectivity',
    description: 'Map image and the three nearby-places columns, each with travel minutes.',
    fields: [
      text('content.eyebrow', 'Eyebrow'),
      text('title', 'Heading', { required: true }),
      text('subtitle', 'Italic line'),
      image('image', 'Location map image'),
      {
        name: 'content.columns',
        label: 'Columns',
        type: 'list',
        itemLabel: 'Column',
        addLabel: 'Add column',
        fields: [
          text('heading', 'Column heading', { required: true }),
          {
            name: 'items',
            label: 'Places',
            type: 'list',
            itemLabel: 'Place',
            addLabel: 'Add place',
            inline: true,
            fields: [text('name', 'Place', { required: true }), { name: 'minutes', label: 'Minutes', type: 'number', min: 0, max: 600, required: true }],
          },
        ],
      },
    ],
  },
  gallery: {
    label: 'Gallery',
    description: 'Heading for the gallery grid. Photos are managed under Gallery.',
    fields: [text('subtitle', 'Eyebrow'), text('title', 'Heading', { required: true })],
  },
  amenities: {
    label: 'Amenities',
    description: 'Heading for the amenities grid. Items are managed under Amenities.',
    fields: [text('content.eyebrow', 'Eyebrow'), text('title', 'Heading', { required: true }), text('subtitle', 'Subheading')],
  },
  video: {
    label: 'Video',
    description: 'Walkthrough video. YouTube, Vimeo or a direct .mp4 link plays inline.',
    fields: [
      text('title', 'Heading', { required: true }),
      text('subtitle', 'Subheading'),
      url('content.videoUrl', 'Video URL', { hint: 'https://… (YouTube, Vimeo or .mp4). Empty disables the play button.' }),
      image('content.posterImage', 'Poster image'),
    ],
  },
  floorPlans: {
    label: 'Floor Plans',
    description: 'Heading and button label. Units are managed under Floor Plans.',
    fields: [text('subtitle', 'Eyebrow'), text('title', 'Heading', { required: true }), text('content.downloadLabel', 'Download button label')],
  },
  rera: {
    label: 'MahaRERA',
    description: 'Registration details, QR code and legal disclaimer.',
    fields: [
      text('title', 'Heading', { required: true }),
      text('content.registrationLabel', 'Registration label'),
      text('content.registrationNumber', 'Registration number'),
      url('content.websiteUrl', 'MahaRERA website'),
      image('image', 'QR code image'),
      text('content.qrCaption', 'QR caption'),
      textarea('body', 'Disclaimer', { rows: 7 }),
    ],
  },
  developer: {
    label: 'Developer',
    description: 'About the developer and the project consultants.',
    fields: [
      text('content.eyebrow', 'Eyebrow'),
      text('title', 'Developer name', { required: true }),
      text('subtitle', 'Tagline'),
      textarea('body', 'Description', { rows: 5 }),
      image('image', 'Logo / image'),
      {
        name: 'content.consultants',
        label: 'Consultants',
        type: 'list',
        itemLabel: 'Consultant',
        addLabel: 'Add consultant',
        inline: true,
        fields: [text('role', 'Role', { required: true }), text('name', 'Name', { required: true })],
      },
    ],
  },
  cta: {
    label: 'Call to action',
    description: 'Closing banner with two buttons. Empty links open the enquiry form.',
    fields: [
      text('subtitle', 'Eyebrow'),
      text('title', 'Heading', { required: true }),
      image('image', 'Background image'),
      {
        name: 'content.primaryCta',
        label: 'Primary button',
        type: 'group',
        fields: [text('label', 'Button label'), url('url', 'Link (leave empty to open the enquiry form)')],
      },
      linkWithFile('content.secondaryCta', 'Secondary button'),
    ],
  },
  footer: {
    label: 'Footer',
    description: 'Offices, contact details, quick links and legal text.',
    fields: [
      text('title', 'Company name'),
      text('subtitle', 'Tagline'),
      image('image', 'Footer logo'),
      office('content.corporateOffice', 'Corporate office'),
      office('content.salesOffice', 'Sales office'),
      linkList('content.quickLinks', 'Quick links'),
      text('content.copyright', 'Copyright line'),
      linkList('content.legalLinks', 'Legal links (leave the link empty to show plain text)'),
    ],
  },
};

// Sections created outside the known list still get the basic fields
export const defaultSectionConfig = {
  label: 'Section',
  description: 'This section has no custom editor yet, so only its basic fields can be edited.',
  fields: [text('title', 'Heading'), text('subtitle', 'Subheading'), textarea('body', 'Body', { rows: 6 }), image('image', 'Image')],
};

// Shown under every section's own fields
export const seoFields = [
  {
    name: 'seo',
    label: 'SEO',
    type: 'group',
    fields: [
      text('metaTitle', 'Meta title', { maxLength: 70, hint: 'Shown in browser tabs and search results (max 70 characters)' }),
      textarea('metaDescription', 'Meta description', { rows: 3, maxLength: 160 }),
      image('ogImage', 'Social share image (og:image)'),
    ],
  },
];

export const statusField = {
  name: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'draft', label: 'Draft — hidden from the public site' },
    { value: 'published', label: 'Published — visible on the public site' },
  ],
};

export const orderField = { name: 'order', label: 'Display order', type: 'number', integer: true, min: 0, max: 100000, hint: 'Lower numbers appear first' };

export const getSectionConfig = (key) => sectionConfigs[key] ?? defaultSectionConfig;
