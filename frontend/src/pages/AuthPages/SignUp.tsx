import { Link } from "react-router";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <AuthLayout>
      <div className="flex w-full flex-1 flex-col lg:w-1/2">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
          <Link to="/" className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#16B378] via-[#2E9BE6] to-[#F2497A] font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-md shadow-[#2E9BE6]/20">
              N
            </div>
            <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold tracking-tight text-slate-900">
              NEXUS <span className="text-[#2E9BE6]">AI</span>
            </span>
          </Link>

          <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-slate-900">
            Créer le compte de votre entreprise
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-500">
            Vous serez le compte Direction — la première étape avant de renseigner
            votre entreprise.
          </p>

          <SignUpForm />
        </div>
      </div>
    </AuthLayout>
  );
}