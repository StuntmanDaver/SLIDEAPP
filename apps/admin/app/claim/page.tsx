"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ClaimContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (token) {
      // Try to open the app via deep link
      const appLink = `slide://claim?token=${token}`;
      window.location.href = appLink;
      
      // If the app doesn't open, show the download prompt
      setTimeout(() => {
        setRedirecting(false);
      }, 2000);
    }
  }, [token]);

  // TODO: Update with real App Store URLs once apps are published
  const iosUrl = "https://apps.apple.com/app/slide/id0000000000";
  const androidUrl = "https://play.google.com/store/apps/details?id=com.slidevenue.consumer";

  return (
    <div className="min-h-screen bg-[#E1E2DD] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-[#090908] mb-2">Slide</h1>
          <p className="text-[#7D737B]">Your VIP pass to the best nightlife</p>
        </div>

        {/* Pass Card */}
        <div className="bg-[#B2AAC2] rounded-3xl p-8 mb-8 shadow-lg">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#090908]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#090908] mb-2">
            You've Been Sent a Pass!
          </h2>
          <p className="text-[#090908] opacity-80">
            Someone sent you a line-skip pass. Download the Slide app to claim it.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="space-y-4">
          <a
            href={iosUrl}
            className="flex items-center justify-center gap-3 bg-[#090908] text-white rounded-full py-4 px-6 font-bold hover:bg-[#1a1a1a] transition"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on the App Store
          </a>
          
          <a
            href={androidUrl}
            className="flex items-center justify-center gap-3 bg-white text-[#090908] rounded-full py-4 px-6 font-bold border border-[#C1C2BD] hover:bg-gray-50 transition"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
            Get it on Google Play
          </a>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-[#7D737B]">
          Already have the app?{" "}
          <a 
            href={`slide://claim?token=${token}`}
            className="text-[#090908] font-medium underline"
          >
            Open in Slide
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ClaimLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E1E2DD] flex items-center justify-center">
        <div className="text-[#7D737B]">Loading...</div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}
