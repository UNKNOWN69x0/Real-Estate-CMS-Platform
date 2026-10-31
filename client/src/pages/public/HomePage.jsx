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

export default function HomePage() {
  return (
    <>
      <SeoHead />
      <Navbar />
      <ApiStatusBanner />
      <main>
        <Hero />
        <About />
        <Connectivity />
        <Gallery />
        <Amenities />
        <Video />
        <FloorPlans />
        <Rera />
        <Developer />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
