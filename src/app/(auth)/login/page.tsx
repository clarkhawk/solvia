import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { LanguageSelector } from "@/components/auth/LanguageSelector";

export default function LoginPage() {
  return (
    <main className="flex min-h-[100vh] w-full flex-col xl:flex-row bg-[#F8FAFC] xl:bg-white overflow-y-auto xl:overflow-hidden">
      
      {/* ========================================================= */}
      {/* LEFT PANEL - BRANDING (Desktop Only) */}
      {/* ========================================================= */}
      <BrandPanel />

      {/* ========================================================= */}
      {/* RIGHT PANEL - FORM */}
      {/* ========================================================= */}
      <section className="flex w-full xl:w-[50%] flex-col bg-[#F8FAFC] xl:bg-white relative min-h-screen xl:min-h-0">
        
        {/* Language Selector (Top Right) */}
        <LanguageSelector />

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex xl:hidden items-center justify-center pt-16 pb-4">
          <img src="/logo.png" alt="Solviaa" className="h-16 w-auto object-contain" />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-12 xl:px-16 2xl:px-24">
          <LoginForm />
        </div>

      </section>
    </main>
  );
}
