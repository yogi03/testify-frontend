import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText, Mail } from "lucide-react";
import { AppNavbar, AppFooter } from "../components/Layout";
import { PageTransition } from "../components/PageTransition";
import { auth } from "../firebase/config";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export function PrivacyTermsPage() {
    const navigate = useNavigate();
    const pageRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (_nextUser) => {
            // Auth listener to keep consistency
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const root = pageRef.current;
        if (!root) return;

        const revealTargets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
        if (!revealTargets.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("reveal-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
        );

        revealTargets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const signedInUser = result.user;
            await setDoc(doc(db, "users", signedInUser.uid), {
                user_id: signedInUser.uid,
                name: signedInUser.displayName,
                email: signedInUser.email,
                created_at: new Date()
            }, { merge: true });
            navigate("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <PageTransition ref={pageRef} className="landing-page min-h-screen bg-[#f7f5ef] text-slate-950 relative overflow-hidden flex flex-col">
            {/* Background Glows matching Landing Page */}
            <div className="landing-hero-glow absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(circle_at_top,_rgba(142,197,252,0.15),_transparent_60%),radial-gradient(circle_at_20%_25%,_rgba(196,255,143,0.18),_transparent_40%)] pointer-events-none" />
            <div className="absolute top-[400px] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_rgba(103,232,249,0.08),_transparent_70%)] pointer-events-none" />

            <AppNavbar onLogin={handleLogin} />

            <main className="relative z-10 flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </Link>

                    {/* Header */}
                    <div data-reveal className="reveal-up mb-12">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                            Privacy Policy & <span className="bg-gradient-to-r from-lime-500 to-emerald-500 bg-clip-text text-transparent">Terms of Service</span>
                        </h1>
                        <p className="text-slate-600 text-lg">Last updated: March 17, 2026</p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8">
                        {/* Privacy Policy */}
                        <section data-reveal className="reveal-up premium-panel rounded-[2rem] p-8 md:p-10 border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Privacy Policy</h2>
                            </div>
                            
                            <div className="prose prose-slate max-w-none space-y-4 text-slate-600 leading-relaxed">
                                <p>At <strong>TESTIFY</strong>, we prioritize your privacy and are committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">1. Data Collection</h3>
                                <p>We collect information you provide directly, such as your name and email when you sign in via Google. We also collect the content you upload (PDFs, URLs) to process them via our AI engine for generating your study materials.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">2. How We Use Data</h3>
                                <p>Your data is used to provide and improve our services, including personalized test generation and progress tracking. Uploaded content is processed temporarily for topic extraction and vectorization.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">3. Data Security</h3>
                                <p>We use industry-standard security measures, including Firebase's secure infrastructure and encrypted connections, to protect your data from unauthorized access.</p>
                            </div>
                        </section>

                        {/* Terms of Service */}
                        <section data-reveal className="reveal-up premium-panel rounded-[2rem] p-8 md:p-10 border border-slate-200" style={{ transitionDelay: "100ms" }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Terms of Service</h2>
                            </div>
                            
                            <div className="prose prose-slate max-w-none space-y-4 text-slate-600 leading-relaxed">
                                <p>By using TESTIFY, you agree to comply with and be bound by the following terms of service.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">1. Acceptable Use</h3>
                                <p>You must use TESTIFY only for lawful educational purposes. You are responsible for ensuring you have the right to upload any content you provide to the platform.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">2. AI limitations</h3>
                                <p>While our RAG-based AI model is designed to minimize hallucinations, users should verify critical information. TESTIFY is a learning aid and not a substitute for official academic evaluation.</p>
                                
                                <h3 className="text-lg font-bold text-slate-900 pt-2">3. Service Availability</h3>
                                <p>We strive to keep TESTIFY available at all times but do not guarantee uninterrupted service. We reserve the right to modify or discontinue features at any time.</p>
                            </div>
                        </section>

                        {/* Contact */}
                        <section data-reveal className="reveal-up premium-panel rounded-[2rem] p-8 md:p-10 border border-slate-200 text-center" style={{ transitionDelay: "200ms" }}>
                            <h2 className="text-xl font-bold mb-4">Have questions?</h2>
                            <p className="text-slate-600 mb-6">If you have any questions about these terms or your privacy, please contact us.</p>
                            <a href="mailto:yogendrachaurasiya30@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-950 text-white font-semibold hover:opacity-90 transition-opacity max-w-full break-all">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span className="break-all text-sm md:text-base">yogendrachaurasiya30@gmail.com</span>
                            </a>
                        </section>
                    </div>
                </div>
            </main>

            <AppFooter />
        </PageTransition>
    );
}
