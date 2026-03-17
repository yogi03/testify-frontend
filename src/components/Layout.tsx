import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, UploadCloud, ChevronDown, Menu, X, Github } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase/config";

export function Layout() {
    return (
        <div className="app-shell min-h-screen text-foreground flex flex-col relative overflow-hidden">
            <div className="app-shell-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
            <div className="app-shell-glow-secondary pointer-events-none absolute inset-x-0 top-[240px] h-[520px]" />

            <AppNavbar />
            <main className="relative z-10 flex-1 container max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
                <Outlet />
            </main>
            <AppFooter />
        </div>
    );
}

type AppNavbarProps = {
    onLogin?: () => void | Promise<void>;
};

export function AppNavbar({ onLogin }: AppNavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profileImageFailed, setProfileImageFailed] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setProfileImageFailed(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await signOut(auth);
        setShowProfileMenu(false);
        setIsMobileMenuOpen(false);
        navigate("/");
    };

    return (
        <header className="app-navbar border-b sticky top-0 z-50 bg-white/80 backdrop-blur-md">
            <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-950 transition-transform duration-300 hover:scale-[1.02]">
                    <img src="/logo.png" alt="TESTIFY logo" className="w-8 h-8 object-contain" />
                    TESTIFY
                </Link>

                <div className="flex items-center gap-4">
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
                        <Link to="/dashboard" className="flex items-center gap-2 hover:text-slate-950 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link to="/upload" className="flex items-center gap-2 hover:text-slate-950 transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            Upload Content
                        </Link>
                        <a 
                            href="https://github.com/yogi03/testify-frontend" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-slate-950 transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </nav>

                    {/* Profile Section (Desktop & Mobile) */}
                    {user ? (
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(prev => !prev)}
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 p-1 md:pl-2 md:pr-3 md:py-1.5 shadow-[0_18px_38px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md hover:bg-white transition-colors"
                            >
                                {user.photoURL && !profileImageFailed ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || "Profile"}
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-slate-200"
                                        onError={() => setProfileImageFailed(true)}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-slate-200 bg-slate-950 text-white flex items-center justify-center text-xs md:text-sm font-bold">
                                        {getUserInitial(user)}
                                    </div>
                                )}
                                <ChevronDown className={`hidden md:block w-4 h-4 text-slate-500 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl p-2 z-[60]">
                                    <div className="px-3 py-2 border-b border-slate-100">
                                        <p className="text-sm font-semibold truncate">{user.displayName || "Signed in"}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : onLogin ? (
                        <button
                            onClick={onLogin}
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Login
                        </button>
                    ) : null}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg animate-in slide-in-from-top duration-300 z-40">
                    <nav className="flex flex-col p-4 space-y-2">
                        <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                            <LayoutDashboard className="w-5 h-5 text-slate-500" />
                            Dashboard
                        </Link>
                        <Link to="/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                            <UploadCloud className="w-5 h-5 text-slate-500" />
                            Upload Content
                        </Link>
                        <a 
                            href="https://github.com/yogi03/testify-frontend" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                        >
                            <Github className="w-5 h-5 text-slate-500" />
                            GitHub
                        </a>
                    </nav>
                </div>
            )}
        </header>
    );
}

function getUserInitial(user: User | null) {
    if (!user) return "U";
    const source = user.displayName || user.email || "User";
    return source.trim().charAt(0).toUpperCase() || "U";
}

export function AppFooter() {
    return (
        <footer className="relative z-10 mt-auto border-t border-slate-200/60 bg-white/80 backdrop-blur-md">
            {/* Subtle premium gradient glow above the footer */}
            {/* <div className="absolute -top-[160px] left-0 right-0 h-[160px] pointer-events-none overflow-hidden select-none">
                <div className="absolute bottom-0 left-0 right-0 h-full opacity-40 blur-[80px]" 
                     style={{ 
                         background: "radial-gradient(circle at 30% 100%, #e0e7ff 0%, transparent 50%), radial-gradient(circle at 70% 100%, #f0fdf4 0%, transparent 50%)" 
                     }} 
                />
            </div> */}
            
            <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tighter text-slate-900 transition-all duration-300 hover:opacity-80">
                        <img src="/logo.png" alt="TESTIFY logo" className="w-8 h-8 object-contain" />
                        TESTIFY
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 text-center sm:text-left">
                        <Link to="/privacy-terms" className="hover:text-slate-950 transition-colors">Privacy & Terms</Link>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
                        <p className="text-slate-400 max-w-[280px] sm:max-w-none">© 2026 TESTIFY AI • Intelligent Learning Platform</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

