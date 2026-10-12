import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  const { t } = useTranslation();

  const steps = [
    { number: "01", color: "#22D3EE" },
    { number: "02", color: "#3B82F6" },
    { number: "03", color: "#6366F1" },
    { number: "04", color: "#8B5CF6" },
  ].map((step, i) => ({
    ...step,
    title: t(`authFlow.signin.guide.steps.${i}.title`),
    text: t(`authFlow.signin.guide.steps.${i}.text`),
  }));

  return (
    <div className="min-h-screen overflow-hidden bg-[#030712] font-['Inter',sans-serif] text-white">

      {/* =========================================================
          BACKGROUND GLOBAL
      ========================================================= */}

      <div className="pointer-events-none fixed inset-0">

        {/* signup / signin image — droite */}
        <div
          className="absolute end-0 top-0 h-full w-[48%] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/signup.jpg')",
            filter: "brightness(.72) saturate(.9)",
          }}
        />

        {/* dark gradient over image */}
        <div className="absolute end-0 top-0 h-full w-[55%] bg-gradient-to-r from-[#030712] via-[#030712]/55 to-transparent" />

       
        <div className="absolute inset-0 bg-[#030712]/20" />

        {/* cyan glow */}
        <div className="absolute -start-40 top-[20%] h-[500px] w-[500px] rounded-full bg-[#22D3EE]/10 blur-[150px]" />

        {/* violet glow */}
        <div className="absolute end-[15%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/10 blur-[160px]" />

        {/* blue glow */}
        <div className="absolute bottom-[-200px] start-[30%] h-[500px] w-[500px] rounded-full bg-[#3B82F6]/10 blur-[150px]" />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)
            `,
            backgroundSize: "70px 70px",
          }}
        />

      </div>


      {/* =========================================================
          MAIN LAYOUT
      ========================================================= */}

      <main className="relative z-10 flex min-h-screen">


        {/* =======================================================
            LEFT — SIGN IN AREA
        ======================================================= */}

        <section className="relative flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:w-[54%] lg:px-14 xl:w-[52%]">

          {/* subtle divider */}
          <div className="pointer-events-none absolute inset-y-0 end-0 w-px bg-gradient-to-b from-transparent via-white/[0.10] to-transparent" />


          <div className="w-full max-w-[510px]">


            {/* ===================================================
                TOP BRAND
            =================================================== */}

            <div className="mb-10 flex items-center justify-between">


              <Link
                to="/"
                className="group flex items-center gap-3"
              >

                {/* logo */}
                <div className="relative">

                  {/* glow behind logo */}
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] opacity-20 blur-xl transition duration-500 group-hover:opacity-40" />

                  <img
                    src="/nexus-logo.jpg"
                    alt="NEXUS AI"
                    className="relative h-12 w-12 rounded-[15px] object-cover shadow-[0_0_25px_rgba(34,211,238,.12)] ring-1 ring-white/15"
                  />

                  {/* tiny reflection */}
                  <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-white/50" />

                </div>


                <div>

                  <div className="font-['Space_Grotesk',sans-serif] text-[18px] font-bold tracking-tight text-white">

                    NEXUS{" "}

                    <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                      AI
                    </span>

                  </div>

                  <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.22em] text-slate-600">
                    {t("common.brandTagline")}
                  </div>

                </div>

              </Link>


              {/* signup link */}

              <Link
                to="/signup"
                className="hidden rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[11px] font-medium text-slate-400 backdrop-blur-xl transition hover:border-[#22D3EE]/20 hover:bg-white/[0.05] hover:text-white sm:block"
              >

                {t("authFlow.signin.notMember")}

                <span className="ms-1.5 text-[#67E8F9]">
                  {t("authFlow.signin.createAccount")}
                </span>

              </Link>

            </div>


            {/* ===================================================
                FORM HEADER
            =================================================== */}

            <div className="mb-8">


              {/* badge */}

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/15 bg-[#22D3EE]/[0.04] px-3 py-1.5 backdrop-blur-xl">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />

                <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#67E8F9]">
                  {t("authFlow.signin.badge")}
                </span>

              </div>


              <h1 className="font-['Space_Grotesk',sans-serif] text-[34px] font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">

                {t("authFlow.signin.title1")}

                <br />

                <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                  {t("authFlow.signin.title2")}
                </span>

              </h1>


              <p className="mt-4 max-w-[470px] text-[13px] leading-7 text-slate-500">
                {t("authFlow.signin.subtitle")}
              </p>

            </div>


            {/* ===================================================
                FORM GLASS CARD
            =================================================== */}

            <div className="relative">


              {/* glow */}

              <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-r from-[#22D3EE]/[0.03] via-[#3B82F6]/[0.03] to-[#8B5CF6]/[0.04] blur-2xl" />


              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#070D1C]/75 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-8">


                {/* top glass reflection */}

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                <div className="pointer-events-none absolute start-[15%] end-[15%] top-0 h-16 bg-white/[0.035] blur-2xl" />


                {/* form title */}

                <div className="mb-6 flex items-center justify-between">


                  <div>

                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#22D3EE]">
                      {t("authFlow.signin.cardEyebrow")}
                    </p>

                    <h2 className="mt-1 text-[15px] font-semibold text-white">
                      {t("authFlow.signin.cardTitle")}
                    </h2>

                  </div>


                  {/* progress */}

                  <div className="flex items-center gap-1.5">

                    <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#3B82F6]" />

                    <span className="h-1.5 w-1.5 rounded-full bg-white/10" />

                    <span className="h-1.5 w-1.5 rounded-full bg-white/10" />

                  </div>

                </div>


                {/* =================================================
                    EXISTING SIGN IN FORM
                    LOGIQUE INCHANGÉE
                ================================================= */}

                <div className="nexus-signin-form">

                  <SignInForm />

                </div>


              </div>

            </div>


            {/* ===================================================
                SECURITY NOTE
            =================================================== */}

            <div className="mt-5 flex items-center justify-center gap-2 text-center">

              <span className="text-[11px] text-[#22D3EE]">
                ◉
              </span>

              <p className="text-[9px] leading-5 text-slate-600">
                {t("authFlow.signin.secureNote")}
              </p>

            </div>


            {/* mobile signup */}

            <div className="mt-5 text-center sm:hidden">

              <Link
                to="/signup"
                className="text-[10px] text-slate-500 transition hover:text-white"
              >

                {t("authFlow.signin.notMember")}

                <span className="ms-1 text-[#67E8F9]">
                  {t("authFlow.signin.createAccount")}
                </span>

              </Link>

            </div>


          </div>

        </section>


        {/* =======================================================
            RIGHT — VISUAL EXPERIENCE
            EXACTEMENT COMME SIGNUP
        ======================================================= */}

       <section className="relative hidden w-[46%] items-center justify-center overflow-hidden lg:flex xl:w-[48%]">

          {/* image depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#030712]/20 via-transparent to-[#030712]/50" />

          {/* cyan radial light */}
          <div className="absolute start-[15%] top-[20%] h-[350px] w-[350px] rounded-full bg-[#22D3EE]/10 blur-[120px]" />

          {/* violet radial light */}
          <div className="absolute bottom-[15%] end-[10%] h-[400px] w-[400px] rounded-full bg-[#8B5CF6]/10 blur-[140px]" />

          {/* =================================================
              VISUAL CONTENT
              
              Container vide supprimé.
              L'image signup.jpg reste visible.
          ================================================= */}

        </section>

      </main>


      {/* =========================================================
          FLOATING PROCESS HINT
          → visible au hover
      ========================================================= */}

      <div className="group fixed bottom-6 end-6 z-50">


        {/* =======================================================
            HINT BUBBLE
        ======================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            bottom-16
            end-0
            w-[285px]
            translate-y-3
            scale-95
            opacity-0
            origin-bottom-right
            transition-all
            duration-300
            ease-out
            group-hover:pointer-events-auto
            group-hover:translate-y-0
            group-hover:scale-100
            group-hover:opacity-100
          "
        >

          {/* Glow */}

          <div className="absolute -inset-3 rounded-[25px] bg-gradient-to-r from-[#22D3EE]/10 to-[#8B5CF6]/10 blur-xl" />


          {/* Glass card */}

          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#071021]/90 p-4 shadow-[0_25px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl">

            {/* Mirror reflection */}

            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

            <div className="pointer-events-none absolute start-[15%] end-[15%] top-0 h-12 bg-white/[0.035] blur-xl" />


            {/* Header */}

            <div className="relative flex items-start gap-3">

              {/* AI icon */}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/10 bg-gradient-to-br from-[#22D3EE]/10 to-[#8B5CF6]/10 text-[#67E8F9] shadow-[0_0_20px_rgba(34,211,238,.08)]">
                ✦
              </div>


              <div className="flex-1">

                <div className="flex items-center justify-between gap-2">

                  <p className="text-[10px] font-semibold text-white">
                    {t("authFlow.signin.guide.title")}
                  </p>

                  <span className="rounded-full border border-[#22D3EE]/10 bg-[#22D3EE]/[0.04] px-2 py-0.5 font-mono text-[6px] text-[#67E8F9]">
                    {t("authFlow.signin.guide.badge")}
                  </span>

                </div>

                <p className="mt-1 text-[8px] leading-5 text-slate-500">
                  {t("authFlow.signin.guide.subtitle")}
                </p>

              </div>

            </div>


            {/* =================================================
                PROCESS
            ================================================= */}

            <div className="relative mt-4">

              {/* connector */}

              <div className="absolute bottom-3 start-[9px] top-3 w-px bg-gradient-to-b from-[#22D3EE]/40 via-[#3B82F6]/25 to-[#8B5CF6]/30" />


              <div className="space-y-3">

                {steps.map((step) => (

                  <div
                    key={step.number}
                    className="relative flex items-start gap-3"
                  >

                    {/* number */}

                    <div
                      className="relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[6px] font-bold"
                      style={{
                        borderColor: `${step.color}35`,
                        backgroundColor: `${step.color}12`,
                        color: step.color,
                        boxShadow: `0 0 12px ${step.color}12`,
                      }}
                    >
                      {step.number}
                    </div>


                    {/* content */}

                    <div className="pt-[1px]">

                      <p className="text-[8px] font-semibold text-slate-200">
                        {step.title}
                      </p>

                      <p className="mt-0.5 text-[7px] leading-4 text-slate-600">
                        {step.text}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* Bottom message */}

            <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2">

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

                <p className="text-[7px] leading-4 text-slate-500">

                  {t("authFlow.signin.guide.currentStep")}

                  <span className="ms-1 font-semibold text-[#67E8F9]">
                    {t("authFlow.signin.guide.currentStepName")}
                  </span>

                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =======================================================
            FLOATING BUTTON
        ======================================================= */}

        <button
          type="button"
          aria-label={t("authFlow.signin.guide.open")}
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/[0.12]
            bg-[#071021]/80
            text-[#67E8F9]
            shadow-[0_12px_40px_rgba(0,0,0,.45)]
            backdrop-blur-2xl
            transition-all
            duration-300
            group-hover:-translate-y-1
            group-hover:border-[#22D3EE]/30
            group-hover:bg-[#0A172A]/90
            group-hover:shadow-[0_15px_45px_rgba(34,211,238,.12)]
          "
        >

          {/* top reflection */}

          <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />


          {/* glow */}

          <span className="absolute inset-0 rounded-2xl bg-[#22D3EE]/0 blur-xl transition group-hover:bg-[#22D3EE]/10" />


          {/* icon */}

          <span className="relative text-lg transition-transform duration-300 group-hover:rotate-12">
            ✦
          </span>


          {/* notification dot */}

          <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

        </button>

      </div>

    </div>
  );
}