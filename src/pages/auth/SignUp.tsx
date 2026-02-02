import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="flex w-full max-w-6xl items-center justify-between gap-12">
        {/* Left side - Hero content */}
        <div className="hidden flex-1 lg:block">
          <div className="space-y-6 text-white">
            <h1 className="text-5xl font-bold leading-tight">
              Join{' '}
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                MBEST
              </span>{' '}
              Today
            </h1>
            <p className="text-xl text-white/80">
              Create your account and start your educational journey. Sign up as a tutor or parent 
              to access MBEST learning management system.
            </p>
            <div className="grid grid-cols-1 gap-4 pt-8">
              <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-3c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v3h3v4H4z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Role-Based Experience</h3>
                  <p className="text-sm text-white/70">Customized interface for your specific needs</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Comprehensive Tracking</h3>
                  <p className="text-sm text-white/70">Monitor progress and stay organized</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 10 2s-1.04.54-1.5 1.34l-.5.68-.5-.67C6.64 2.05 5.66 3 5.66 3s-.34.95-.16 2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Collaborative Learning</h3>
                  <p className="text-sm text-white/70">Connect with tutors, students, and parents</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign up form */}
        <div className="w-full max-w-lg lg:w-auto">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}