import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { Home, ShoppingCart, Settings, HelpCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { cartCount, state, speak } = useApp();

  const navItems = [
    { to: '/', label: 'Home', icon: Home, shortcut: 'Ctrl+H' },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, shortcut: 'Ctrl+Shift+C' },
    { to: '/settings', label: 'Settings', icon: Settings, shortcut: 'Ctrl+,' },
    { to: '/help', label: 'Help', icon: HelpCircle, shortcut: '?' },
  ];

  const handleVoiceCommand = () => {
    speak('Voice commands ready. Say capture, add, details, cart, or help.');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-neon p-0.5 shadow-glow-cyan">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-background">
              <span className="font-display text-lg font-bold text-primary">AI</span>
            </div>
          </div>
          <span className="hidden font-display text-lg font-semibold tracking-wide text-foreground md:block">
            SmartShop
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:px-4"
              activeClassName="bg-primary/10 text-primary shadow-glow-cyan"
              aria-label={`${item.label}${item.to === '/cart' && cartCount > 0 ? `, ${cartCount} items` : ''}`}
              title={`${item.label} (${item.shortcut})`}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden text-sm font-medium md:inline">{item.label}</span>
              {item.to === '/cart' && cartCount > 0 && (
                <span className="cart-badge" aria-hidden="true">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Voice Command Button */}
          <Button
            variant="voice"
            size="icon"
            onClick={handleVoiceCommand}
            aria-label="Activate voice commands"
            title="Voice Commands (V)"
            className="ml-2"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
