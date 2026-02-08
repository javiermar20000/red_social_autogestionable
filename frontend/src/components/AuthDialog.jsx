import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { Label } from './ui/Label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs.jsx';

const AuthDialog = ({ open, onOpenChange, onLogin, onRegister, loading = false }) => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', nombre: '', role: 'OFERENTE' });

  useEffect(() => {
    if (!open) {
      setTab('login');
      setForm({ email: '', password: '', nombre: '', role: 'OFERENTE' });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === 'login') {
      onLogin?.({ email: form.email, password: form.password }, onOpenChange);
    } else {
      onRegister?.(form, onOpenChange);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} overlayClassName="z-[70]">
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Bienvenido a Match Coffee</DialogTitle>
          <DialogDescription className="text-center">
            Inicia sesión para comentar o crear negocios y publicaciones gastronómicas.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" variant="danger" disabled={loading}>
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nombre</Label>
                <Input
                  id="register-name"
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Contraseña</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-role">Rol</Label>
                <select
                  id="register-role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="OFERENTE">Oferente</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="VISITANTE">Visitante</option>
                  <option value="admin">Admin global</option>
                </select>
              </div>
              <Button type="submit" className="w-full" variant="danger" disabled={loading}>
                Registrarme
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
