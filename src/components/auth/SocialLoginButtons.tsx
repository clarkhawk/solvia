"use client";

interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onGithubLogin: () => void;
  disabled?: boolean;
}

export function SocialLoginButtons({ onGoogleLogin, onGithubLogin, disabled }: SocialLoginButtonsProps) {
  return (
    <div className="flex flex-col gap-4 mt-6">
      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={disabled}
        className="w-full h-[54px] flex items-center justify-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] font-semibold hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[1px] hover:shadow-sm"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
          <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.73 17.57C14.74 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.7 5.83999 14.11H2.17999V16.95C3.98999 20.53 7.69999 23 12 23Z" fill="#34A853"/>
          <path d="M5.83999 14.11C5.60999 13.45 5.48999 12.74 5.48999 12C5.48999 11.26 5.60999 10.55 5.83999 9.89V7.05H2.17999C1.42999 8.54 0.99999 10.22 0.99999 12C0.99999 13.78 1.42999 15.46 2.17999 16.95L5.83999 14.11Z" fill="#FBBC05"/>
          <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.37 3.85C17.45 2.06 14.96 1 12 1C7.69999 1 3.98999 3.47 2.17999 7.05L5.83999 9.89C6.70999 7.3 9.13999 5.38 12 5.38Z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>
      
      <button
        type="button"
        onClick={onGithubLogin}
        disabled={disabled}
        className="w-full h-[54px] flex items-center justify-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] font-semibold hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[1px] hover:shadow-sm"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-[#0F172A]">
          <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z"/>
        </svg>
        Se connecter avec GitHub
      </button>
    </div>
  );
}
