import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Calendar className="w-7 h-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              EventHub
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
