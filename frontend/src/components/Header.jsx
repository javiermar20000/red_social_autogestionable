import { Search, Heart, Bell, User, LogOut, PlusCircle } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';

const Header = ({ search, onSearchChange, onExplore, onCreate, onAuth, onLogout, currentUser }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">GastroHub</h1>
          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" className="text-sm font-medium" onClick={() => onSearchChange('')}>
              Inicio
            </Button>
            <Button variant="ghost" className="text-sm font-medium" onClick={onExplore}>
              Explorar
            </Button>
            <Button variant="ghost" className="text-sm font-medium" onClick={onCreate}>
              Crear
            </Button>
          </nav>
        </div>

        <div className="flex-1 max-w-2xl mx-2 md:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar publicaciones, negocios o categorías..."
              className="pl-10 bg-secondary border-0 focus-visible:ring-1 text-sm md:text-base"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCreate} title="Crear publicación o negocio">
            <PlusCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExplore} title="Explorar categorías">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExplore} title="Explorar">
            <Heart className="h-5 w-5" />
          </Button>
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <p className="text-xs text-muted-foreground">Conectado como</p>
                <p className="text-sm font-semibold">
                  {currentUser.email || currentUser.nombre} · {currentUser.role || currentUser.rol}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={onAuth} className="hidden md:inline-flex">
              <User className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          )}
          {!currentUser && (
            <Button variant="ghost" size="icon" onClick={onAuth} className="md:hidden">
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
