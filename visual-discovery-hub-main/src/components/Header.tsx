import { Search, Heart, Bell, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import AuthDialog from "./AuthDialog";
import ExploreDialog from "./ExploreDialog";
import { useState } from "react";

const Header = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-primary">Pinspire</h1>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-sm font-medium">
              Home
            </Button>
            <Button variant="ghost" className="text-sm font-medium" onClick={() => setExploreOpen(true)}>
              Explore
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Create
            </Button>
          </nav>
        </div>

        <div className="flex-1 max-w-2xl mx-2 md:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 bg-secondary border-0 focus-visible:ring-1 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setAuthOpen(true)}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <ExploreDialog open={exploreOpen} onOpenChange={setExploreOpen} />
    </header>
  );
};

export default Header;
