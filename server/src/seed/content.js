// Seed content transcribed from /reference/page1-4.png.
// Images are neutral placeholders; replace them from the admin panel (Cloudinary upload).
const img = (w, h, label) => `https://placehold.co/${w}x${h}/8B5E3C/FAF7F2?text=${encodeURIComponent(label)}`;

const items = (list) => list.map(([name, minutes]) => ({ name, minutes }));

export const sections = [
  {
    key: 'navbar',
    title: 'One Chembur',
    order: 0,
    content: {
      logoText: 'CODENAME one CHEMBUR',
      ctaLabel: 'Enquire Now',
      enquiryTitle: 'Enquire Now',
      enquiryIntro: 'Share your details and our team will get back to you shortly.',
      enquirySubmitLabel: 'Submit enquiry',
      enquirySuccessTitle: 'Enquiry received',
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
  {
    key: 'hero',
    title: 'one',
    subtitle: 'Where home extends to life.',
    image: img(1600, 900, 'Hero Building'),
    order: 1,
    content: {
      location: 'Subhash Nagar, Chembur, Mumbai',
      codename: 'Codename',
      projectName: 'one',
      projectSuffix: 'Chembur',
      primaryCta: { label: 'Explore the Project', href: '#about' },
      secondaryCta: { label: 'Enquire Now', action: 'enquire' },
    },
    seo: {
      metaTitle: 'One Chembur | 1 & 2 BHK Residences in Subhash Nagar, Chembur',
      metaDescription:
        'One Chembur by Swastik Group: 1 & 2 BHK residences with 16-storey habitational floors and a modern fitness center in Subhash Nagar, Chembur, Mumbai.',
      ogImage: img(1200, 630, 'One Chembur'),
    },
  },
  {
    key: 'about',
    title: 'A Legacy Built for the Future',
    subtitle: 'About the Project',
    image: img(800, 1000, 'Building Photo'),
    order: 2,
    body:
      'Located in Subhash Nagar, Chembur, this residential redevelopment offers a practical yet elevated living experience. Comprising 1 & 2 BHK residences in Ground-Level Commercial Spaces + 16-Story Habitational Floors, the project is planned with a strong focus on functionality and lifestyle — adding daily convenience, a modern gymnasium/fitness center, and lifestyle amenities, ensuring a well-rounded living environment for residents.',
    content: {
      highlights: ['1 & 2 BHK Residences', 'Ground-Level Commercial Spaces', '16-Story Habitational Floors'],
      stats: [
        { value: '3.25', label: 'Million Sq Ft Ongoing' },
        { value: '3.55', label: 'Million Sq Ft Completed' },
        { value: '2600+', label: 'Happy Families' },
      ],
      brochureCta: { label: 'Download Brochure', url: '' },
    },
  },
  {
    key: 'connectivity',
    title: 'What if your home is as well connected as your ambitions?',
    subtitle: 'This is the one.',
    image: img(800, 640, 'Location Map'),
    order: 3,
    content: {
      eyebrow: 'Location & Connectivity',
      columns: [
        {
          heading: 'Connectivity',
          items: items([
            ['Chembur Railway Station', 5],
            ['Chembur Monorail Station', 5],
            ['Eastern Freeway', 7],
            ['Upcoming Metro Station', 8],
            ['Santacruz–Chembur Link Road', 10],
            ['BKC', 15],
            ['Airport', 25],
          ]),
        },
        {
          heading: 'Education',
          items: items([
            ['AFAC English High School', 1],
            ["St. Antony's Girls High School", 1],
            ['St. Gregorious High School', 5],
            ['Our Lady of Perpetual Succour High School', 2],
            ['Swami Vivekanand School & College', 8],
            ['Ryan International', 12],
            ['Shah & Anchor Campus', 7],
            ['RBK International', 12],
          ]),
        },
        {
          heading: 'Recreation & Lifestyle',
          items: items([
            ['K-Star Mall', 5],
            ['Westside', 5],
            ['Phoenix Market City', 17],
            ['R City Mall', 15],
            ['Fun Cinemas', 7],
            ['Movie Time', 6],
          ]),
        },
      ],
    },
  },
  {
    key: 'gallery',
    title: 'Every Angle Tells a Story',
    subtitle: 'Gallery',
    order: 4,
  },
  {
    key: 'amenities',
    title: 'A Lifestyle That Completes the Experience',
    subtitle: 'What if your finest moments happened before you even left home? This is the one.',
    order: 5,
    content: { eyebrow: 'Lifestyle Amenities' },
  },
  {
    key: 'video',
    title: 'Experience One Chembur',
    subtitle: 'Step inside and see what elevated living truly feels like.',
    order: 6,
    content: { videoUrl: '', posterImage: '' },
  },
  {
    key: 'floorPlans',
    title: 'Find the Home That Fits Your Life',
    subtitle: 'Floor Plans',
    order: 7,
    content: { downloadLabel: 'Download PDF' },
  },
  {
    key: 'rera',
    title: 'MahaRERA Details (Not Updated)',
    order: 8,
    image: img(240, 240, 'MahaRERA QR'),
    body:
      'This communication is purely conceptual and not a legal offer. The information contained herein is only indicative in nature. The building design, project amenities and facilities are subject to final approval by the competent authority. All the artworks, features, facilities, views, surroundings, landscapes, amenities, images, models, aesthetics, building elevation, furniture, tiles, interior work and/or other details are artistic conceptualization for illustration purposes only and do not purport to be actual depictions of the offering. Intending purchasers are requested to verify all details with the developer before booking. The project is funded by Standard Chartered Bank and mortgaged under the trusteeship of IDBI Trusteeship Services Ltd.',
    content: {
      registrationLabel: 'MahaRERA No.',
      registrationNumber: 'PR1180002502829',
      websiteUrl: 'https://maharera.mahaonline.gov.in',
      qrCaption: 'MahaRERA QR Code',
    },
  },
  {
    key: 'developer',
    title: 'Swastik Group',
    subtitle: 'A legacy of trust',
    image: img(600, 800, 'Swastik Group'),
    order: 9,
    body:
      'Swastik Group has been shaping Mumbai’s residential and commercial landscape with decades of trusted development. Each project reflects a commitment to quality construction, functional design, and community-centered living — delivered with the reliability that has made Swastik a preferred name for homebuyers across the city.',
    content: {
      eyebrow: 'About the Developer',
      consultants: [
        { role: 'Architect', name: 'Rohit Ponnar, Sai Sampada DBS' },
        { role: 'RCC Consultant', name: 'System Structural Consultants Pvt. Ltd.' },
        { role: 'Vaastu Consultant', name: 'Kamlesh Vastu Engineer' },
        { role: 'Legal Consultant', name: 'Lexicon Law Partners' },
        { role: 'MEP Consultant', name: 'Rupesh Gujarathi' },
      ],
    },
  },
  {
    key: 'cta',
    title: 'Your Next Chapter Begins in Chembur',
    subtitle: 'Ready to call it home?',
    image: img(1600, 500, 'Chembur Skyline'),
    order: 10,
    content: {
      primaryCta: { label: 'Schedule a Site Visit', action: 'enquire' },
      secondaryCta: { label: 'Download Brochure', url: '' },
    },
  },
  {
    key: 'footer',
    title: 'Swastik Group',
    subtitle: 'A legacy of trust. Building homes that endure for generations.',
    image: img(240, 120, 'Swastik Group'),
    order: 11,
    content: {
      corporateOffice: {
        heading: 'Corporate Office',
        address: '312, Swastik Group, Swastik Disa Corporate Park, L. B. S. Marg, Ghatkopar (West), Mumbai - 400086',
        phones: ['022-6689 0000'],
        email: 'swastikgroup123@gmail.com',
      },
      salesOffice: {
        heading: 'Swastik Sales Office',
        address: 'Swastik Bliss Building no 52, Adarsh Sapna CHS, Subhash Nagar, Chembur, Mumbai - 400071',
        phones: ['022-5064 7478', '98331 08888'],
        email: '',
      },
      quickLinksHeading: 'Quick Links',
      quickLinks: [
        { label: 'About the Project', href: '#about' },
        { label: 'Floor Plans', href: '#floor-plans' },
        { label: 'Amenities', href: '#amenities' },
        { label: 'Connectivity', href: '#connectivity' },
        { label: 'About Developer', href: '#developer' },
        { label: 'Contact Us', href: '#contact' },
      ],
      copyright: '© 2025 Swastik Group. All Rights Reserved',
      legalLinks: [
        { label: 'Privacy Policy', href: '' },
        { label: 'Terms & Conditions', href: '' },
      ],
    },
  },
];

// [title, icon (lucide-react), gallery category]
const amenityRows = [
  ['Gymnasium / Fitness Center', 'Dumbbell'],
  ['Indoor Games Area', 'Gamepad2'],
  ['Yoga & Meditation Area', 'Flower2'],
  ['Senior Citizen Seating Area', 'Armchair'],
  ['Walkaway Track', 'Footprints'],
  ['High-Speed Elevators', 'ChevronsUpDown'],
  ['Ample Parking', 'SquareParking'],
  ['CCTV Security', 'Cctv'],
  ['Intercom System', 'Phone'],
];

export const amenities = amenityRows.map(([title, icon], i) => ({ title, icon, description: '', order: i, status: 'published' }));

// Gallery order on the page differs from the amenity grid
const galleryTitles = [
  'Gymnasium / Fitness Center',
  'Indoor Games Area',
  'Yoga & Meditation Area',
  'Ample Parking',
  'Grand Entrance Lobby',
  'Senior Citizen Seating Area',
  'Walkway Track',
  'CCTV Security',
  'Intercom System',
];

export const gallery = galleryTitles.map((title, i) => ({
  title,
  image: img(800, 600, title),
  category: 'amenities',
  order: i,
  status: 'published',
}));

// "floors" for 2 BHK Alto isn't visible in the reference; adjust in the admin panel.
export const floorPlans = [
  { unitType: '1 RK Classic', carpetArea: 285, balcony: 45, totalArea: 330, floors: '1-8' },
  { unitType: '1 BHK Grand', carpetArea: 385, balcony: 65, totalArea: 450, floors: '9-15' },
  { unitType: '2 BHK Alto', carpetArea: 585, balcony: 85, totalArea: 670, floors: '9-16' },
].map((plan, i) => ({ ...plan, image: img(700, 600, `${plan.unitType} Floor Plan`), pdfUrl: '', order: i, status: 'published' }));
