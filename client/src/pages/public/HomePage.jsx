import Navbar from '../../components/layout/Navbar.jsx';
import ApiStatusBanner from '../../components/ui/ApiStatusBanner.jsx';
import Hero from '../../components/sections/Hero.jsx';
import About from '../../components/sections/About.jsx';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <ApiStatusBanner />
      <main>
        <Hero />
        <About />
      </main>
    </>
  );
}
