import { useState } from "react";
import Preloader from "@/components/preloader/Preloader";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import WhyUs from "@/components/sections/WhyUs";
import Menu from "@/components/sections/Menu";
import ScatterGallery from "@/components/sections/ScatterGallery";
import Testimonials from "@/components/sections/Testimonials";
import CustomOrder from "@/components/sections/CustomOrder";
import Footer from "@/components/sections/Footer";
import BookingModal from "@/components/booking/BookingModal";

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = () => setBookingOpen(true);
  const closeBooking = () => setBookingOpen(false);

  return (
    <>
      <Preloader />
      <Navbar />
      <Hero onBookClick={openBooking} />
      <About />
      <WhyUs />
      <Menu />
      <ScatterGallery />
      <Testimonials />
      <CustomOrder onBookClick={openBooking} />
      <Footer />
      <BookingModal open={bookingOpen} onClose={closeBooking} />
    </>
  );
}
