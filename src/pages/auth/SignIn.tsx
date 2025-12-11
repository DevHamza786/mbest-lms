import { SignInForm } from '@/components/auth/SignInForm';

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="flex w-full max-w-6xl items-center justify-between gap-12">
        {/* Left side - Hero content */}
        <div className="hidden flex-1 lg:block">
          <div className="space-y-6 text-white">
            <h1 className="text-5xl font-bold leading-tight">
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                MBEST
              </span>
            </h1>
            <p className="text-xl text-white/80">
              Access your personalized learning management system. Connect with your classes, 
              track your progress, and achieve your educational goals.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10.5 5.16-.76 9-4.95 9-10.5V7l-10-5z"/>
                  </svg>
                </div>
                <h3 className="font-semibold">Secure Access</h3>
                <p className="text-sm text-white/70">
                  Role-based authentication ensures you see only what's relevant to you.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <h3 className="font-semibold">Organized Learning</h3>
                <p className="text-sm text-white/70">
                  Everything you need - classes, assignments, and resources - in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full max-w-md lg:w-auto">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}