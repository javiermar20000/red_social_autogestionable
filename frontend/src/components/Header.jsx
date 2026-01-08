import { useState } from 'react';
import { Search, Heart, Bell, User, LogOut, PlusCircle, Menu, X } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { cn } from '../lib/cn.js';
import logo from '../assets/logo_gastrohub.png';

const Header = ({
  search,
  onSearchChange,
  onExplore,
  onNotifications,
  hasNotifications = false,
  notificationsCount = 0,
  onCreate,
  onAuth,
  onLogout,
  onHome,
  currentUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasNotificationBadge = notificationsCount > 0;

  const handleAndClose = (action) => {
    if (action) {
      action();
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container relative flex h-16 items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-4">
          <img src={logo} alt="GastroHub" className="h-10 w-auto" />
          <nav className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              className="text-sm font-medium"
              onClick={() => {
                if (onHome) {
                  onHome();
                } else {
                  onSearchChange('');
                }
              }}
            >
              Inicio
            </Button>
            <Button variant="ghost" className="text-sm font-medium" onClick={onExplore}>
              Explorar
            </Button>
          </nav>
        </div>

        <div className="flex-1 max-w-2xl mx-2 md:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="    Buscar..."
              className="pl-10 bg-light border-0 focus-visible:ring-1 text-sm md:text-base"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="icon" onClick={onCreate} title="Crear publicación o negocio">
              <PlusCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotifications}
              title="Notificaciones"
              className={cn('relative', hasNotifications && 'bg-rose-100 text-rose-600 hover:bg-rose-200')}
            >
              <Bell className="h-5 w-5" />
              {hasNotificationBadge && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white">
                  {notificationsCount > 9 ? '9+' : notificationsCount}
                </span>
              )}
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
              <Button variant="danger" size="sm" onClick={onAuth} className="hidden md:inline-flex">
                <User className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
                <div className="border-b border-border/70 px-3 py-2">
                  {currentUser ? (
                    <>
                      <p className="text-xs text-muted-foreground">Conectado como</p>
                      <p className="text-sm font-semibold">
                        {currentUser.email || currentUser.nombre} · {currentUser.role || currentUser.rol}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-center">Bienvenido a GastroHub</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleAndClose(onCreate)}
                    title="Crear publicación o negocio"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Crear
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full',
                      hasNotificationBadge ? 'justify-between' : 'justify-center',
                      hasNotifications && 'text-rose-600'
                    )}
                    onClick={() => handleAndClose(onNotifications)}
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      <span className={hasNotificationBadge ? 'text-left' : 'text-center'}>Notificaciones</span>
                    </span>
                    {hasNotificationBadge && (
                      <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {notificationsCount > 9 ? '9+' : notificationsCount}
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleAndClose(onExplore)}>
                    <Heart className="h-5 w-5" />
                    Me gusta
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleAndClose(onExplore)}>
                    <Heart className="h-5 w-5" />
                    Explorar
                  </Button>
                  {currentUser ? (
                    <Button variant="ghost" className="justify-start" onClick={() => handleAndClose(onLogout)}>
                      <LogOut className="h-5 w-5" />
                      Cerrar sesión
                    </Button>
                  ) : (
                    <Button variant="danger" className="justify-start" onClick={() => handleAndClose(onAuth)}>
                      <User className="h-5 w-5" />
                      Entrar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
