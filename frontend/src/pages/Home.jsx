import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay } from "swiper/modules";
import "swiper/css";

function Home() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center sm:px-8 sm:pt-14">
      <h1 className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
        Turn Requirements Into
        <br className="hidden sm:block" /> Reliable Test Cases.
      </h1>
      <p className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
        Casefy helps QA engineers generate, discover, and execute test cases
        from requirements, diagrams, user stories, and real web pages.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        <Link
          to="/signup"
          className="inline-flex min-h-[52px] min-w-[172px] items-center justify-center rounded-md border border-[#2941372e] bg-[#294137] px-8 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Start free
        </Link>
        <Link
          to="/how-it-works"
          className="inline-flex min-h-[52px] min-w-[140px] items-center justify-center rounded-md border border-[#CFDDD5] bg-[#edf3ef] px-8 text-sm font-medium text-[#14231c] transition-colors hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Learn more
        </Link>
      </div>

      <figure
        id="dashboard-preview"
        aria-label="Casefy dashboard preview"
        className="mx-auto mt-12 max-w-[1040px] scroll-mt-24 overflow-hidden rounded-lg border border-[#CFDDD5] bg-[#ffffff]"
      >
        <div className="flex h-10 items-center gap-3 border-b border-[#CFDDD5] px-4 text-left">
          <div aria-hidden="true" className="flex shrink-0 items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full border border-[#dea123] bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full border border-[#1aab29] bg-[#28c840]" />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-[#6c7771]">
            CASEFY / DASHBOARD
          </span>
        </div>
        <img
          src="https://placehold.co/960x620"
          alt="Placeholder for the Casefy dashboard preview"
          width="960"
          height="620"
          className="block h-auto w-full"
        />
      </figure>
      <section
        aria-label="Partner logos"
        className="mx-auto mt-12 max-w-[1040px] py-8"
      >
        <h2 className="mb-12 text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
          Partners
        </h2>
        <Swiper
          modules={[Autoplay, A11y]}
          slidesPerView={2}
          spaceBetween={24}
          breakpoints={{
            640: { slidesPerView: 3, spaceBetween: 32 },
            1024: { slidesPerView: 4, spaceBetween: 48 },
          }}
          loop
          speed={4000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          onSwiper={(swiper) => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              swiper.autoplay.stop();
            }
          }}
          className="partners-swiper"
        >
          <SwiperSlide>
            <img
              src="/Partners/Google_Logo.svg"
              alt="Google"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Github_Logo.svg"
              alt="GitHub"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Amazon_Logo.svg"
              alt="Amazon"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Notion_Logo.svg"
              alt="Notion"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Subway_Logo.svg"
              alt="Subway"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Tamara_Logo.svg"
              alt="Tamara"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
          <SwiperSlide>
            <img
              src="/Partners/Youtube_Logo.svg"
              alt="YouTube"
              className="mx-auto h-16 w-40 object-contain"
            />
          </SwiperSlide>
        </Swiper>
      </section>
    </section>
  );
}

export default Home;
