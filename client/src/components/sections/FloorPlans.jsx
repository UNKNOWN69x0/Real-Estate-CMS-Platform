import { useSection } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import { useCollection } from '../../hooks/useCollection.js';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { LoadError } from '../ui/CollectionNotice.jsx';

const sqft = (value) => `${Number(value).toLocaleString('en-IN')} sq.ft`;

function PlanCard({ plan, downloadLabel, onRequest }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-brown-900">{plan.unitType}</h3>
      {plan.floors && <p className="mt-0.5 text-xs text-brown-600">Floors {plan.floors}</p>}

      <SmartImage
        src={plan.image}
        alt={`${plan.unitType} floor plan`}
        className="mt-4 aspect-[5/4] w-full border border-brown-400/40 bg-cream object-contain"
      />

      {plan.pdfUrl ? (
        <Button href={plan.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-5 w-full">
          {downloadLabel}
        </Button>
      ) : (
        // No PDF uploaded yet: capture the lead instead of a dead link
        <Button onClick={onRequest} className="mt-5 w-full">
          {downloadLabel}
        </Button>
      )}
    </Card>
  );
}

export default function FloorPlans() {
  const { section, loading } = useSection('floorPlans');
  const { items, status, retry } = useCollection('floor-plans');
  const { openInquiry } = useInquiry();

  if (!loading && !section) return null;
  if (status === 'ready' && items.length === 0) return null;

  const downloadLabel = section?.content?.downloadLabel ?? 'Download PDF';
  const header = 'px-2 py-3 text-center text-[0.6rem] font-semibold uppercase tracking-[0.15em] sm:text-xs';
  const cell = 'px-2 py-3 text-center text-xs text-brown-900 sm:text-sm';

  return (
    <SectionWrapper id="floor-plans" className="bg-cream py-16 sm:py-24">
      <SectionHeading eyebrow={section?.subtitle} title={section?.title} align="left" />

      {status === 'error' && <LoadError label="floor plans" onRetry={retry} />}

      {status === 'loading' && (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-36 w-full" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse">
              <caption className="sr-only">Unit types and areas</caption>
              <thead className="bg-brown-600 text-white">
                <tr>
                  <th scope="col" className={header}>Unit type</th>
                  <th scope="col" className={header}>Carpet area</th>
                  <th scope="col" className={header}>Balcony</th>
                  <th scope="col" className={header}>Total area</th>
                </tr>
              </thead>
              <tbody>
                {items.map((plan, index) => (
                  <tr key={plan._id} className={index % 2 === 0 ? 'bg-sand' : 'bg-white'}>
                    <th scope="row" className={`${cell} font-semibold`}>{plan.unitType}</th>
                    <td className={cell}>{sqft(plan.carpetArea)}</td>
                    <td className={cell}>{sqft(plan.balcony)}</td>
                    <td className={cell}>{sqft(plan.totalArea)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((plan) => (
              <PlanCard key={plan._id} plan={plan} downloadLabel={downloadLabel} onRequest={() => openInquiry('floor-plan')} />
            ))}
          </div>
        </>
      )}
    </SectionWrapper>
  );
}
