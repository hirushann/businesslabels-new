import { getTranslations } from "next-intl/server";
import Link from "next/link";
import ReviewsSection from "@/components/ReviewsSection";
import AvailabilityStatus from "./AvailabilityStatus";
import ContactForm from "./ContactForm";

export async function generateMetadata() {
   const t = await getTranslations("contactPage");
   return {
      title: t("metadataTitle"),
      description: t("metadataDescription"),
   };
}

async function getTeamMembers() {
   const apiBaseUrl = process.env.BBNL_API_BASE_URL;
   if (!apiBaseUrl) return [];

   try {
      const url = `${apiBaseUrl.replace(/\/$/, "")}/api/team-members`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
   } catch (err) {
      console.error("Failed to fetch team members:", err);
      return [];
   }
}

export default async function ContactPage() {
   const t = await getTranslations("contactPage");
   const teamMembers = await getTeamMembers();
   return (
      <>
         <div className="w-full flex flex-col">
            <div className="relative w-full overflow-hidden py-4 px-4 sm:px-6 lg:px-10">
               {/* Decorative orange patches */}
               <div className="w-72 h-72 absolute -left-20 top-0 bg-brand/20 rounded-full blur-[100px] pointer-events-none z-0" />
               <div className="w-72 h-72 absolute -right-20 bottom-0 bg-brand/20 rounded-full blur-[100px] pointer-events-none z-0" />

               <div className="relative z-10 max-w-360 w-full mx-auto grid grid-cols-1 lg:grid-cols-2 justify-start items-start gap-12 py-12 sm:py-20 lg:py-24">
                  <div className="self-stretch flex flex-col justify-start items-start gap-12">
                     <div className="flex-1 flex flex-col justify-start items-start gap-6">
                        <div className="self-stretch flex flex-col justify-start items-start gap-4">
                           <div className="h-4 flex justify-start items-center gap-2">
                              <div>
                                 <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                       d="M1 9.9615H3.23083V6.6025C3.23083 6.43183 3.28856 6.28872 3.404 6.17317C3.51956 6.05772 3.66267 6 3.83333 6H6.16667C6.33733 6 6.48044 6.05772 6.596 6.17317C6.71144 6.28872 6.76917 6.43183 6.76917 6.6025V9.9615H9V4.064C9 4.02989 8.9925 3.99895 8.9775 3.97117C8.96261 3.94339 8.94233 3.91878 8.91667 3.89733L5.12183 1.04483C5.08761 1.01494 5.047 1 5 1C4.953 1 4.91239 1.01494 4.87817 1.04483L1.08333 3.89733C1.05767 3.91878 1.03739 3.94339 1.0225 3.97117C1.0075 3.99895 1 4.02989 1 4.064V9.9615ZM0 9.9615V4.064C0 3.87322 0.0426665 3.6925 0.128 3.52183C0.213444 3.35106 0.331444 3.21044 0.482 3.1L4.277 0.241C4.48756 0.0803337 4.72822 0 4.999 0C5.26978 0 5.51111 0.0803337 5.723 0.241L9.518 3.1C9.66856 3.21044 9.78656 3.35106 9.872 3.52183C9.95733 3.6925 10 3.87322 10 4.064V9.9615C10 10.2342 9.9015 10.469 9.7045 10.666C9.5075 10.863 9.27267 10.9615 9 10.9615H6.37183C6.20106 10.9615 6.05794 10.9037 5.9425 10.7882C5.82694 10.6727 5.76917 10.5296 5.76917 10.3588V7H4.23083V10.3588C4.23083 10.5296 4.17306 10.6727 4.0575 10.7882C3.94206 10.9037 3.79894 10.9615 3.62817 10.9615H1C0.727333 10.9615 0.4925 10.863 0.2955 10.666C0.0984999 10.469 0 10.2342 0 9.9615Z"
                                       fill="var(--subtle)"
                                    />
                                 </svg>
                              </div>
                              <div className="justify-start text-zinc-500 text-sm font-normal leading-5">/</div>
                              <div className="self-stretch justify-start text-neutral-700 text-sm font-bold leading-5">{t("breadcrumb")}</div>
                           </div>
                           <div className="self-stretch justify-start text-neutral-800 text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight lg:leading-[86.40px]">{t("title")}</div>
                           <div className="self-stretch justify-start text-neutral-700 text-xl font-normal leading-8">
                              {t("subtitle")}
                           </div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-4">
                           <div className="self-stretch flex justify-start items-start gap-3">
                              <div className="size- pt-0.5 flex justify-start items-start">
                                 <div className="size-8 bg-brand/10 rounded-full flex justify-center items-center">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                                       <g clipPath="url(#clip0_2508_7829)">
                                          <path d="M4.00004 12H2.66671C2.31309 12 1.97395 11.8595 1.7239 11.6095C1.47385 11.3594 1.33337 11.0203 1.33337 10.6667V7.33333C1.33337 6.97971 1.47385 6.64057 1.7239 6.39052C1.97395 6.14048 2.31309 6 2.66671 6H13.3334C13.687 6 14.0261 6.14048 14.2762 6.39052C14.5262 6.64057 14.6667 6.97971 14.6667 7.33333V10.6667C14.6667 11.0203 14.5262 11.3594 14.2762 11.6095C14.0261 11.8595 13.687 12 13.3334 12H12" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M4 5.9987V1.9987C4 1.82189 4.07024 1.65232 4.19526 1.52729C4.32029 1.40227 4.48986 1.33203 4.66667 1.33203H11.3333C11.5101 1.33203 11.6797 1.40227 11.8047 1.52729C11.9298 1.65232 12 1.82189 12 1.9987V5.9987" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M11.3333 9.33203H4.66667C4.29848 9.33203 4 9.63051 4 9.9987V13.9987C4 14.3669 4.29848 14.6654 4.66667 14.6654H11.3333C11.7015 14.6654 12 14.3669 12 13.9987V9.9987C12 9.63051 11.7015 9.33203 11.3333 9.33203Z" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                       </g>
                                       <defs>
                                          <clipPath id="clip0_2508_7829">
                                             <rect width="16" height="16" fill="white"/>
                                          </clipPath>
                                       </defs>
                                    </svg>
                                 </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-start items-start gap-2">
                                 <div className="self-stretch flex flex-col justify-start items-start">
                                    <div className="justify-start text-neutral-800 text-xl font-bold leading-6">{t("printerAdviceTitle")}</div>
                                 </div>
                                 <div className="self-stretch justify-start text-neutral-700 text-base font-normal">
                                    {t("printerAdviceDesc")}
                                 </div>
                              </div>
                           </div>
                           <div className="self-stretch flex justify-start items-start gap-3">
                              <div className="size- pt-0.5 flex justify-start items-start">
                                 <div className="size-8 bg-brand/10 rounded-full flex justify-center items-center">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                                       <path d="M7.33333 14.4879C7.53603 14.6049 7.76595 14.6665 8 14.6665C8.23405 14.6665 8.46397 14.6049 8.66667 14.4879L13.3333 11.8212C13.5358 11.7043 13.704 11.5362 13.821 11.3338C13.938 11.1314 13.9998 10.9017 14 10.6679V5.33457C13.9998 5.10075 13.938 4.87111 13.821 4.66868C13.704 4.46625 13.5358 4.29815 13.3333 4.18124L8.66667 1.51457C8.46397 1.39755 8.23405 1.33594 8 1.33594C7.76595 1.33594 7.53603 1.39755 7.33333 1.51457L2.66667 4.18124C2.46418 4.29815 2.29599 4.46625 2.17897 4.66868C2.06196 4.87111 2.00024 5.10075 2 5.33457V10.6679C2.00024 10.9017 2.06196 11.1314 2.17897 11.3338C2.29599 11.5362 2.46418 11.7043 2.66667 11.8212L7.33333 14.4879Z" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                       <path d="M8 14.6667V8" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                       <path d="M2.19336 4.66797L8.00003 8.0013L13.8067 4.66797" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                       <path d="M5 2.84766L11 6.28099" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                 </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-start items-start gap-2">
                                 <div className="self-stretch flex flex-col justify-start items-start">
                                    <div className="justify-start text-neutral-800 text-xl font-bold leading-6">{t("labelAdviceTitle")}</div>
                                 </div>
                                 <div className="self-stretch justify-start text-neutral-700 text-base font-normal">
                                    {t("labelAdviceDesc")}
                                 </div>
                              </div>
                           </div>
                           <div className="self-stretch flex justify-start items-start gap-3">
                              <div className="size- pt-0.5 flex justify-start items-start">
                                 <div className="size-8 bg-brand/10 rounded-full flex justify-center items-center">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                                       <g clipPath="url(#clip0_2508_7893)">
                                          <path d="M14.5341 6.66764C14.8385 8.16184 14.6215 9.71525 13.9193 11.0688C13.2171 12.4224 12.072 13.4943 10.6751 14.1058C9.27816 14.7174 7.71382 14.8315 6.24293 14.4292C4.77205 14.0269 3.48353 13.1326 2.59225 11.8953C1.70097 10.6579 1.26081 9.15246 1.34518 7.62989C1.42954 6.10733 2.03332 4.6597 3.05583 3.52842C4.07835 2.39714 5.45779 1.65059 6.96411 1.41327C8.47043 1.17595 10.0126 1.46221 11.3334 2.2243" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M6 7.33464L8 9.33464L14.6667 2.66797" stroke="#F18800" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                                       </g>
                                       <defs>
                                          <clipPath id="clip0_2508_7893">
                                             <rect width="16" height="16" fill="white"/>
                                          </clipPath>
                                       </defs>
                                    </svg>
                                 </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-start items-start gap-2">
                                 <div className="self-stretch flex flex-col justify-start items-start">
                                    <div className="justify-start text-neutral-800 text-xl font-bold leading-6">{t("sampleTitle")}</div>
                                 </div>
                                 <div className="self-stretch justify-start">
                                    <Link href="/print-sample" className="text-brand text-base font-bold underline">{t("sampleLink")}</Link>
                                    <span className="text-neutral-700 text-base font-normal">{t("sampleDesc")}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
                        <div className="self-stretch flex flex-col sm:flex-row justify-start items-stretch gap-4">
                           <a href="tel:+31318590465" className="group flex-1 self-stretch p-6 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-200 flex flex-col justify-start items-center gap-4 hover:shadow-md hover:outline-amber-400 transition-all cursor-pointer">
                              <div className="self-stretch flex flex-col justify-center items-start gap-4">
                                 <div className="self-stretch flex justify-center items-center gap-3">
                                    <div>
                                       <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path
                                             d="M15.9402 17C14.0557 17 12.1625 16.5618 10.2605 15.6855C8.35867 14.8092 6.61125 13.573 5.01825 11.977C3.42542 10.3808 2.19083 8.63333 1.3145 6.7345C0.438167 4.83583 0 2.94425 0 1.05975C0 0.756917 0.1 0.504583 0.3 0.30275C0.5 0.100916 0.75 0 1.05 0H4.3115C4.564 0 4.78675 0.082417 4.97975 0.24725C5.17275 0.411917 5.2955 0.615417 5.348 0.85775L5.92125 3.8C5.96092 4.073 5.95258 4.30758 5.89625 4.50375C5.83975 4.69992 5.73842 4.86467 5.59225 4.998L3.28275 7.24625C3.65442 7.92692 4.07908 8.57083 4.55675 9.178C5.03425 9.785 5.55125 10.3648 6.10775 10.9173C6.65642 11.4661 7.23975 11.9757 7.85775 12.4462C8.47575 12.9167 9.14308 13.3546 9.85975 13.7598L12.1038 11.4963C12.2603 11.3334 12.4498 11.2193 12.6723 11.1538C12.8946 11.0884 13.1257 11.0724 13.3655 11.1058L16.1423 11.6713C16.3948 11.7379 16.6008 11.8667 16.7605 12.0577C16.9202 12.2487 17 12.4654 17 12.7078V15.95C17 16.25 16.8991 16.5 16.6973 16.7C16.4954 16.9 16.2431 17 15.9402 17ZM2.573 5.827L4.35775 4.11925C4.38975 4.09358 4.41058 4.05833 4.42025 4.0135C4.42992 3.96867 4.42833 3.927 4.4155 3.8885L3.98075 1.65375C3.96792 1.60258 3.9455 1.56417 3.9135 1.5385C3.8815 1.51283 3.83983 1.5 3.7885 1.5H1.65C1.6115 1.5 1.57942 1.51283 1.55375 1.5385C1.52825 1.56417 1.5155 1.59625 1.5155 1.63475C1.56667 2.31808 1.6785 3.01225 1.851 3.71725C2.02333 4.42242 2.264 5.12567 2.573 5.827ZM11.273 14.4693C11.9358 14.7783 12.6272 15.0145 13.347 15.178C14.067 15.3413 14.7397 15.4384 15.3652 15.4693C15.4037 15.4693 15.4358 15.4564 15.4615 15.4307C15.4872 15.4051 15.5 15.373 15.5 15.3345V13.2308C15.5 13.1794 15.4872 13.1377 15.4615 13.1058C15.4358 13.0738 15.3974 13.0513 15.3462 13.0385L13.2462 12.6115C13.2077 12.5987 13.1741 12.5971 13.1453 12.6067C13.1164 12.6164 13.0859 12.6372 13.0538 12.6692L11.273 14.4693Z"
                                             fill="var(--subtle)"
                                          />
                                       </svg>
                                    </div>
                                    <div className="text-center justify-start text-neutral-800 text-xl font-bold leading-6">{t("callTitle")}</div>
                                 </div>
                                 <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                    <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-bold leading-6 group-hover:text-brand transition-colors">
                                       +31 (0)318 590 465
                                    </div>
                                    <AvailabilityStatus />
                                 </div>
                              </div>
                           </a>
                           <a href="mailto:verkoop@businesslabels.nl" className="group flex-1 self-stretch p-6 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-200 flex flex-col justify-start items-center gap-4 hover:shadow-md hover:outline-amber-400 transition-all cursor-pointer">
                              <div className="self-stretch flex justify-center items-center gap-3">
                                 <div>
                                    <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                       <path
                                          d="M1.80775 15C1.30258 15 0.875 14.825 0.525 14.475C0.175 14.125 0 13.6974 0 13.1923V1.80775C0 1.30258 0.175 0.875 0.525 0.525C0.875 0.175 1.30258 0 1.80775 0H17.1923C17.6974 0 18.125 0.175 18.475 0.525C18.825 0.875 17.6974 15 17.1923 15H1.80775ZM17.5 2.94225L9.9865 7.752C9.90967 7.7955 9.83017 7.82975 9.748 7.85475C9.666 7.87975 9.58333 7.89225 9.5 7.89225C9.41667 7.89225 9.334 7.87975 9.252 7.85475C9.16983 7.82975 9.09033 7.7955 9.0135 7.752L1.5 2.94225V13.1923C1.5 13.2821 1.52883 13.3558 1.5865 13.4135C1.64417 13.4712 1.71792 13.5 1.80775 13.5H17.1923C17.2821 13.5 17.3558 13.4712 17.4135 13.4135C17.4712 13.3558 17.5 13.2821 17.5 13.1923V2.94225ZM9.5 6.5L17.3463 1.5H1.65375L9.5 6.5ZM1.5 3.173V2.02975V2.0595V2.02775V3.173Z"
                                          fill="var(--subtle)"
                                       />
                                    </svg>
                                 </div>
                                 <div className="text-center justify-start text-neutral-800 text-xl font-bold leading-6">{t("emailTitle")}</div>
                              </div>
                              <div className="self-stretch flex flex-col justify-start items-center gap-2">
                                 <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-bold leading-6 group-hover:text-brand transition-colors">
                                    verkoop@businesslabels.nl
                                 </div>
                                 <div className="self-stretch text-center justify-start text-zinc-500 text-base font-normal leading-6">
                                    {t("emailTime")}
                                 </div>
                              </div>
                           </a>
                        </div>
                     </div>
                  </div>
                  <ContactForm />
               </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 lg:py-32 bg-gray-50 flex flex-col justify-start items-start gap-12">
               <div className="max-w-360 mx-auto self-stretch flex flex-col justify-start items-center gap-4">
                  <div className="self-stretch text-center justify-start text-neutral-800 text-4xl font-bold leading-[48px]">
                     {t("teamTitle")}
                  </div>
                  <div className="text-center justify-start text-neutral-700 text-lg font-normal leading-7">
                     {t("teamDesc")}
                  </div>
               </div>
               <div className="max-w-360 mx-auto self-stretch flex flex-wrap justify-center items-stretch gap-6">
                  {teamMembers.map((member) => (
                     <div
                        key={member.id}
                        className="flex-1 min-w-[280px] px-6 py-10 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] flex flex-col justify-center items-center gap-6"
                     >
                        <img
                           className="size-28 relative rounded-[230px] object-cover"
                           src={member.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f59e0b&color=fff`}
                           alt={member.name}
                        />
                        <div className="self-stretch flex flex-col justify-center items-center gap-5">
                           <div className="self-stretch flex flex-col justify-start items-center gap-2">
                              <div className="self-stretch text-center justify-start text-neutral-800 text-2xl font-bold leading-7">
                                 {member.name}
                              </div>
                              {member.function && (
                                 <div className="text-center text-brand text-lg font-semibold leading-relaxed">
                                    {member.function}
                                 </div>
                              )}
                           </div>
                           
                           {member.text && (
                              <div className="self-stretch text-center text-neutral-600 text-base font-normal leading-relaxed">
                                 {member.text}
                              </div>
                           )}

                           {(member.email || member.phone || member.linkedin_url) && (
                              <div className="self-stretch flex flex-col justify-start items-center gap-3">
                                 {(member.email || member.phone) && (
                                    <div className="flex flex-col justify-start items-center gap-1">
                                       {member.email && (
                                          <a
                                             href={`mailto:${member.email}`}
                                             className="text-center text-neutral-700 text-base font-normal leading-6 hover:text-brand transition-colors"
                                          >
                                             {member.email}
                                          </a>
                                       )}
                                       {member.phone && (
                                          <a
                                             href={`tel:${member.phone}`}
                                             className="text-center text-neutral-700 text-base font-normal leading-6 hover:text-brand transition-colors"
                                          >
                                             {member.phone}
                                          </a>
                                       )}
                                    </div>
                                 )}
                                 {member.linkedin_url && (
                                    <a
                                       href={member.linkedin_url}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="text-neutral-400 hover:text-brand transition-colors"
                                       title="LinkedIn Profile"
                                    >
                                       <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                       </svg>
                                    </a>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <ReviewsSection />
      </>
   );
}
