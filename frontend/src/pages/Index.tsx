import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tighter">
          YOUR CAMPUS<br />
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            EVENTS
          </span><br />
          JUST GOT FASTER
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          Discover, register, and manage university events in real-time. Connect
          with clubs, attend workshops, and never miss what matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/student-signup">
            <Button variant="hero" size="lg">
              Signup as Student
            </Button>
          </Link>
          <Link to="/club-login">
            <Button variant="heroOutline" size="lg">
              Login as Club Member
            </Button>
          </Link>
          <Link to="/admin-login">
            <Button variant="heroOutline" size="lg">
              Login as Admin
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/30">
        Made with ❤️ for your campus
      </footer>
    </div>
  );
};

export default Index;
