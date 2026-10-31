import Image from "next/image";
import Link from "next/link";
import logo from "@/public/Logo-Brand.png";

function Logo() {
  return (
    <Link href="/" className="z-10">
      <Image
        src={logo}
        quality={100}
        height="50"
        width="120"
        alt="Casefy logo"
      />
    </Link>
  );
}

export default Logo;
