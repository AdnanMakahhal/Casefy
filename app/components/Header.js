import Logo from "./Logo";
import Navigation from "./Navigation";

function Header() {
  return (
    <header className="bg-[#0E1612]">
      <div>
        <Logo />
        <Navigation />
      </div>
    </header>
  );
}

export default Header;
