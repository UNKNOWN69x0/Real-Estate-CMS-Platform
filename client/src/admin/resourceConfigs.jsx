import { getAmenityIcon } from '../utils/amenityIcons.js';
import { orderField, statusField } from './sectionConfigs.js';

const text = (name, label, extra = {}) => ({ name, label, type: 'text', ...extra });
const number = (name, label, extra = {}) => ({ name, label, type: 'number', min: 0, max: 100000, ...extra });

const thumb = (src, alt) =>
  src ? <img src={src} alt={alt} loading="lazy" className="h-10 w-14 object-cover" /> : <span className="text-xs text-brown-400">—</span>;

const sqft = (value) => (value == null ? '—' : `${Number(value).toLocaleString('en-IN')} sq.ft`);

// Each entry configures one generic <ResourcePage> (list + filters + modal form + delete + publish toggle)
export const resourceConfigs = {
  amenities: {
    path: 'amenities',
    title: 'Amenities',
    singular: 'amenity',
    description: 'Lifestyle amenities shown as icon cards on the site.',
    searchPlaceholder: 'Search amenities…',
    defaultSort: 'order',
    fields: [
      text('title', 'Title', { required: true, maxLength: 120 }),
      { name: 'description', label: 'Description (optional)', type: 'textarea', rows: 3, maxLength: 500 },
      { name: 'icon', label: 'Icon', type: 'icon' },
      { name: 'image', label: 'Image (optional)', type: 'image' },
      orderField,
      statusField,
    ],
    columns: [
      { key: 'title', header: 'Title', sortKey: 'title' },
      {
        key: 'icon',
        header: 'Icon',
        cell: (row) => {
          const Icon = getAmenityIcon(row.icon);
          return (
            <span className="inline-flex items-center gap-2">
              <Icon size={16} aria-hidden="true" /> {row.icon}
            </span>
          );
        },
      },
      { key: 'order', header: 'Order', sortKey: 'order' },
    ],
    newRecord: { title: '', description: '', icon: 'Sparkles', image: '', order: 0, status: 'draft' },
  },

  gallery: {
    path: 'gallery',
    title: 'Gallery',
    singular: 'gallery item',
    description: 'Photos shown in the gallery grid and lightbox.',
    searchPlaceholder: 'Search by title or category…',
    defaultSort: 'order',
    fields: [
      text('title', 'Caption', { required: true, maxLength: 120 }),
      { name: 'image', label: 'Photo', type: 'image', required: true },
      text('category', 'Category', { maxLength: 60 }),
      orderField,
      statusField,
    ],
    columns: [
      { key: 'title', header: 'Caption', sortKey: 'title' },
      { key: 'image', header: 'Photo', cell: (row) => thumb(row.image, row.title) },
      { key: 'category', header: 'Category', sortKey: 'category' },
      { key: 'order', header: 'Order', sortKey: 'order' },
    ],
    newRecord: { title: '', image: '', category: 'general', order: 0, status: 'draft' },
  },

  'floor-plans': {
    path: 'floor-plans',
    title: 'Floor Plans',
    singular: 'floor plan',
    description: 'Unit types shown in the area table and plan cards.',
    searchPlaceholder: 'Search by unit type or floors…',
    defaultSort: 'order',
    fields: [
      text('unitType', 'Unit type', { required: true, maxLength: 80, placeholder: 'e.g. 1 BHK Grand' }),
      number('carpetArea', 'Carpet area (sq.ft)', { required: true }),
      number('balcony', 'Balcony (sq.ft)'),
      number('totalArea', 'Total area (sq.ft)', { required: true }),
      text('floors', 'Floors', { maxLength: 40, placeholder: 'e.g. 1-8' }),
      { name: 'image', label: 'Floor plan image', type: 'image' },
      { name: 'pdfUrl', label: 'Floor plan PDF', type: 'file', accept: 'application/pdf' },
      orderField,
      statusField,
    ],
    columns: [
      { key: 'unitType', header: 'Unit type', sortKey: 'unitType' },
      { key: 'carpetArea', header: 'Carpet', sortKey: 'carpetArea', cell: (row) => sqft(row.carpetArea) },
      { key: 'balcony', header: 'Balcony', cell: (row) => sqft(row.balcony) },
      { key: 'totalArea', header: 'Total', sortKey: 'totalArea', cell: (row) => sqft(row.totalArea) },
      { key: 'floors', header: 'Floors' },
      { key: 'order', header: 'Order', sortKey: 'order' },
    ],
    newRecord: { unitType: '', carpetArea: '', balcony: '', totalArea: '', floors: '', image: '', pdfUrl: '', order: 0, status: 'draft' },
  },
};
