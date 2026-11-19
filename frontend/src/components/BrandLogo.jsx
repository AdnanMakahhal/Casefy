export default function BrandLogo() {
  return (
    <span className="flex h-[50px] items-center gap-1.5">
      <img
        src="/Logo/Casefy_Icon.svg"
        alt=""
        width="34"
        height="34"
        className="block size-[34px] shrink-0 object-contain"
      />
      <span
        aria-hidden="true"
        className="font-heading text-[26px] leading-none font-bold tracking-[-0.035em] text-[#294137] uppercase"
      >
        Casefy
      </span>
    </span>
  );
}
