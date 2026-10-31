import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { LANGUAGES } from "@/data/taxonomy";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LogOut, Scale } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export const LANG_KEY = "haqdaar.lang";

export default function Layout({ lang, onLangChange }) {
  const copy = t(lang);
  const location = useLocation();
  const [localLang, setLocalLang] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const { logout } = useAuth();
  const active = lang || localLang;
  const setLang = onLangChange || ((next) => {
    setLocalLang(next);
    localStorage.setItem(LANG_KEY, next);
  });
  const isChat = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-paper">
              <Scale className="h-4.5 w-4.5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-none tracking-tight">
                {t(active).brand}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t(active).brandSub}
              </span>
            </span>
          </NavLink>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink
                to="/"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground",
                  isChat && "bg-secondary text-foreground",
                )}
              >
                {copy.navChat}
              </NavLink>
              <NavLink
                to="/schemes"
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground",
                    isActive && "bg-secondary text-foreground",
                  )
                }
              >
                {copy.navSchemes}
              </NavLink>
              <NavLink
                to="/applications"
                className={({ isActive }) => cn("rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground", isActive && "bg-secondary text-foreground")}
              >
                {copy.navApplications}
              </NavLink>
            </nav>
            <div className="flex items-center rounded-xl border border-border bg-card/70 p-0.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLang(l.key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-sm transition",
                    active === l.key
                      ? "bg-ink text-paper shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={active === l.key}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-border bg-card/70 px-3 text-xs text-muted-foreground transition hover:text-foreground md:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              {active === "hi" ? "लॉग आउट" : active === "pa" ? "ਲੌਗ ਆਉਟ" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={{ lang: active, setLang }} />
      </main>

      <footer className="border-t border-border/60 px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        {copy.footer}
      </footer>
    </div>
  );
}
