import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSectionsStatus } from '../context/SectionsContext.jsx';

const DEFAULTS = {
  metaTitle: 'One Chembur',
  metaDescription: '1 & 2 BHK residences in Subhash Nagar, Chembur, Mumbai by Swastik Group.',
  ogImage: '',
};

/**
 * Page-level meta from the CMS. The hero section's SEO fields win; any field it leaves
 * empty is taken from the first other section (by order) that has it.
 * Note: this runs in the browser, so crawlers that don't execute JS won't see these tags.
 */
export default function SeoHead() {
  const { byKey } = useSectionsStatus();

  // Drop index.html's static fallback tags so they don't sit next to the CMS-driven ones below
  useEffect(() => {
    document.querySelectorAll('[data-static-seo]').forEach((node) => node.remove());
  }, []);

  const ordered = Object.values(byKey).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const pick = (field) =>
    byKey.hero?.seo?.[field] || ordered.map((s) => s.seo?.[field]).find(Boolean) || DEFAULTS[field];

  const title = pick('metaTitle');
  const description = pick('metaDescription');
  const image = pick('ogImage');
  const url = `${window.location.origin}${window.location.pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="One Chembur" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
