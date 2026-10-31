import { useSectionsStatus } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import { customSectionId, isBuiltInSection } from '../../utils/sectionKeys.js';
import { safeHref } from '../../utils/safeUrl.js';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Button from '../ui/Button.jsx';

function CustomSection({ section }) {
  const { openInquiry } = useInquiry();
  const content = section.content ?? {};
  const imageLeft = content.imagePosition === 'left';
  const background = content.background === 'sand' ? 'bg-sand' : 'bg-white';
  const paragraphs = (section.body ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const cta = content.cta;
  const ctaHref = safeHref(cta?.href);

  return (
    <SectionWrapper
      id={customSectionId(section.key)}
      className={`${background} py-16 sm:py-24`}
      containerClassName={`grid items-center gap-10 ${section.image ? 'md:grid-cols-2 md:gap-14' : ''}`}
    >
      <div className={imageLeft ? 'md:order-2' : ''}>
        <SectionHeading eyebrow={section.subtitle} title={section.title} align="left" />
        <div className="mt-5 space-y-4 text-sm leading-7 text-brown-800 sm:text-[0.95rem]">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        {cta?.label &&
          (ctaHref ? (
            <Button href={ctaHref} className="mt-7">
              {cta.label}
            </Button>
          ) : (
            // No link set: capture the lead with the enquiry form instead of a dead button
            <Button onClick={() => openInquiry(`custom-${section.key}`)} className="mt-7">
              {cta.label}
            </Button>
          ))}
      </div>

      {section.image && (
        <SmartImage src={section.image} alt={section.title || ''} width={900} className={`aspect-[4/3] w-full object-cover ${imageLeft ? 'md:order-1' : ''}`} />
      )}
    </SectionWrapper>
  );
}

// Every published section that isn't one of the built-in blocks, in the order set in the admin
export default function CustomSections() {
  const { status, byKey } = useSectionsStatus();
  if (status !== 'ready') return null;

  const sections = Object.values(byKey)
    .filter((section) => !isBuiltInSection(section.key))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return sections.map((section) => <CustomSection key={section.key} section={section} />);
}
