"use client";

import Image from "next/image";

export function BrandPanel() {
  return (
    <section className="hidden xl:flex w-[50%] relative z-10 bg-[#062B5A] flex-col p-16 overflow-visible">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#07549A]/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#08B9C8]/10 blur-[100px]" />
      </div>

      {/* Top Header: Logo */}
      <div className="relative z-10 flex flex-col items-start mb-6">
        <Image 
          src="/logo_white_text_final.png" 
          alt="Solviaa" 
          width={240} 
          height={80} 
          className="object-contain" 
          priority 
        />
      </div>

      {/* Main Title */}
      <div className="relative z-10 flex flex-col items-start w-full mt-0">
        <h1 className="text-[48px] font-bold leading-[1.05] text-white tracking-tight relative z-[60]">
          Anticipez<br />
          l&apos;impayé,<br />
          <span className="text-[#08B9C8]">assurez l&apos;avenir.</span>
        </h1>
      </div>
      
      {/* Bottom Illustration */}
      <div className="absolute bottom-[-1rem] right-[-10rem] w-[130%] flex items-end justify-end pointer-events-none select-none z-50">
        <div className="relative w-full max-w-[850px]">
          <Image 
            src="/images/solviaa-illustration.png" 
            alt="Illustration Solviaa" 
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
