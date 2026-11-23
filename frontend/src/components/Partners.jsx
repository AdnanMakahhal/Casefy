import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay } from "swiper/modules";
import { useReducedMotion } from "motion/react";
import "swiper/css";

const partners = [
  { name: "Google", image: "/Partners/Google_Logo.svg" },
  { name: "GitHub", image: "/Partners/Github_Logo.svg" },
  { name: "Amazon", image: "/Partners/Amazon_Logo.svg" },
  { name: "Notion", image: "/Partners/Notion_Logo.svg" },
  { name: "Subway", image: "/Partners/Subway_Logo.svg" },
  { name: "Tamara", image: "/Partners/Tamara_Logo.svg" },
  { name: "YouTube", image: "/Partners/Youtube_Logo.svg" },
];

export default function Partners() {
  const reduceMotion = useReducedMotion();

  return (
    <Reveal as="section" aria-labelledby="partners-heading" className="mx-auto mt-12 max-w-[1040px] py-8">
      <H2 variant="unstyled" id="partners-heading" className="mb-12 text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
        Partners
      </H2>
      <Swiper
        modules={[Autoplay, A11y]}
        slidesPerView={2}
        spaceBetween={24}
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 32 },
          1024: { slidesPerView: 4, spaceBetween: 48 },
        }}
        loop
        speed={reduceMotion ? 0 : 4000}
        autoplay={reduceMotion ? false : {
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        className="partners-swiper"
      >
        {partners.map(({ name, image }) => (
          <SwiperSlide key={name}>
            <div className="mx-auto flex h-16 w-40 items-center justify-center gap-2 text-[#102019]">
              <img
                src={image}
                alt={name}
                width="160"
                height="64"
                className="h-16 w-40 object-contain"
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </Reveal>
  );
}
