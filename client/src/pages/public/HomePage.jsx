import Navbar from '../../components/layout/Navbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import ApiStatusBanner from '../../components/ui/ApiStatusBanner.jsx';
import SeoHead from '../../components/SeoHead.jsx';
import Hero from '../../components/sections/Hero.jsx';
import About from '../../components/sections/About.jsx';
import Connectivity from '../../components/sections/Connectivity.jsx';
import Gallery from '../../components/sections/Gallery.jsx';
import Amenities from '../../components/sections/Amenities.jsx';
import Video from '../../components/sections/Video.jsx';
import FloorPlans from '../../components/sections/FloorPlans.jsx';
import Rera from '../../components/sections/Rera.jsx';
import Developer from '../../components/sections/Developer.jsx';
import Cta from '../../components/sections/Cta.jsx';
import CustomSections from '../../components/sections/CustomSections.jsx';

export default function HomePage() {
  return (
    <>
      <SeoHead />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-brown-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <ApiStatusBanner />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <About />
        <Connectivity />
        <Gallery />
        <Amenities />
        <Video />
        <FloorPlans />
        <Rera />
        <Developer />
        <CustomSections />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
