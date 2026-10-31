import { Router } from 'express';
import { createCrud } from '../utils/crudFactory.js';
import { toPatchSchema } from '../utils/patchSchema.js';
import { Section } from '../models/Section.js';
import { Amenity } from '../models/Amenity.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { FloorPlan } from '../models/FloorPlan.js';
import { Inquiry } from '../models/Inquiry.js';
import {
  amenitySchema,
  floorPlanSchema,
  gallerySchema,
  inquiryUpdateSchema,
  sectionSchema,
} from '../validators/schemas.js';

// One entry per CMS collection; the factory does the rest.
export const resources = {
  sections: createCrud({
    Model: Section,
    entity: 'section',
    createSchema: sectionSchema,
    // A section's key is its identity (the public site looks sections up by it), so it can't be renamed after creation
    updateSchema: toPatchSchema(sectionSchema).omit({ key: true }),
    searchFields: ['key', 'title', 'subtitle'],
    sortFields: ['order', 'key', 'title', 'createdAt', 'updatedAt'],
    labelField: 'key',
    publicLookup: 'key',
  }),
  amenities: createCrud({
    Model: Amenity,
    entity: 'amenity',
    createSchema: amenitySchema,
    searchFields: ['title', 'description'],
    sortFields: ['order', 'title', 'createdAt', 'updatedAt'],
  }),
  gallery: createCrud({
    Model: GalleryItem,
    entity: 'gallery item',
    createSchema: gallerySchema,
    searchFields: ['title', 'category'],
    filterFields: ['status', 'category'],
    sortFields: ['order', 'title', 'category', 'createdAt', 'updatedAt'],
  }),
  'floor-plans': createCrud({
    Model: FloorPlan,
    entity: 'floor plan',
    createSchema: floorPlanSchema,
    searchFields: ['unitType', 'floors'],
    sortFields: ['order', 'unitType', 'carpetArea', 'totalArea', 'createdAt', 'updatedAt'],
    labelField: 'unitType',
  }),
  inquiries: createCrud({
    Model: Inquiry,
    entity: 'inquiry',
    updateSchema: inquiryUpdateSchema,
    searchFields: ['name', 'email', 'phone', 'message'],
    sortFields: ['createdAt', 'name', 'status'],
    defaultSort: '-createdAt',
    labelField: 'name',
    publishable: false,
    disable: ['create'],
  }),
};

export const publicResourceRouter = Router();

for (const [path, crud] of Object.entries(resources)) {
  if (path !== 'inquiries') publicResourceRouter.use(`/${path}`, crud.publicRouter);
}
