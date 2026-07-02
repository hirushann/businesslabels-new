import { getTranslations } from "next-intl/server";
import ReviewsSection from "@/components/ReviewsSection";
import ContactForm from "./ContactForm";

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
   const t = await getTranslations();
   const teamMembers = await getTeamMembers();
   return (
      <>
         <div className="w-full flex flex-col py-24">
            <div className="max-w-360 w-full mx-auto grid grid-cols-1 sm:grid-cols-2 justify-start items-start gap-12">
               <div className="self-stretch inline-flex flex-col justify-start items-start gap-12">
                  <div className="flex-1 flex flex-col justify-start items-start gap-6">
                     <div className="self-stretch flex flex-col justify-start items-start gap-4">
                        <div className="h-4 inline-flex justify-start items-center gap-2">
                           <div>
                              <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path
                                    d="M1 9.9615H3.23083V6.6025C3.23083 6.43183 3.28856 6.28872 3.404 6.17317C3.51956 6.05772 3.66267 6 3.83333 6H6.16667C6.33733 6 6.48044 6.05772 6.596 6.17317C6.71144 6.28872 6.76917 6.43183 6.76917 6.6025V9.9615H9V4.064C9 4.02989 8.9925 3.99895 8.9775 3.97117C8.96261 3.94339 8.94233 3.91878 8.91667 3.89733L5.12183 1.04483C5.08761 1.01494 5.047 1 5 1C4.953 1 4.91239 1.01494 4.87817 1.04483L1.08333 3.89733C1.05767 3.91878 1.03739 3.94339 1.0225 3.97117C1.0075 3.99895 1 4.02989 1 4.064V9.9615ZM0 9.9615V4.064C0 3.87322 0.0426665 3.6925 0.128 3.52183C0.213444 3.35106 0.331444 3.21044 0.482 3.1L4.277 0.241C4.48756 0.0803337 4.72822 0 4.999 0C5.26978 0 5.51111 0.0803337 5.723 0.241L9.518 3.1C9.66856 3.21044 9.78656 3.35106 9.872 3.52183C9.95733 3.6925 10 3.87322 10 4.064V9.9615C10 10.2342 9.9015 10.469 9.7045 10.666C9.5075 10.863 9.27267 10.9615 9 10.9615H6.37183C6.20106 10.9615 6.05794 10.9037 5.9425 10.7882C5.82694 10.6727 5.76917 10.5296 5.76917 10.3588V7H4.23083V10.3588C4.23083 10.5296 4.17306 10.6727 4.0575 10.7882C3.94206 10.9037 3.79894 10.9615 3.62817 10.9615H1C0.727333 10.9615 0.4925 10.863 0.2955 10.666C0.0984999 10.469 0 10.2342 0 9.9615Z"
                                    fill="#888888"
                                 />
                              </svg>
                           </div>
                           <div className="justify-start text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">/</div>
                           <div className="self-stretch justify-start text-neutral-700 text-sm font-semibold font-['Segoe_UI'] leading-5">Contact</div>
                        </div>
                        <div className="self-stretch justify-start text-neutral-800 text-7xl font-bold font-['Segoe_UI'] leading-[86.40px]">Contact Us</div>
                        <div className="self-stretch justify-start text-neutral-700 text-xl font-normal font-['Segoe_UI'] leading-8">
                           No chatbots, no queues. One of our label experts will get back to you within 2 hours — or call us directly.
                        </div>
                     </div>
                     <div className="self-stretch flex flex-col justify-start items-start gap-4">
                        <div className="self-stretch inline-flex justify-start items-start gap-3">
                           <div className="size- pt-0.5 flex justify-start items-start">
                              <div className="size-8 bg-amber-500/10 rounded-full flex justify-center items-center">
                                 <div className="size-4 relative overflow-hidden">
                                    <div className="w-3.5 h-1.5 left-[1.33px] top-[6px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-2 h-1 left-[4px] top-[1.33px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-2 h-1.5 left-[4px] top-[9.33px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                              <div className="self-stretch flex flex-col justify-start items-start">
                                 <div className="justify-start text-neutral-800 text-xl font-bold font-['Segoe_UI'] leading-6">Printer advice</div>
                              </div>
                              <div className="self-stretch justify-start text-neutral-700 text-base font-normal font-['Segoe_UI']">
                                 Help choosing the right Epson ColorWorks printer for your application.
                              </div>
                           </div>
                        </div>
                        <div className="self-stretch inline-flex justify-start items-start gap-3">
                           <div className="size- pt-0.5 flex justify-start items-start">
                              <div className="size-8 bg-amber-500/10 rounded-full flex justify-center items-center">
                                 <div className="size-4 relative overflow-hidden">
                                    <div className="w-3 h-3.5 left-[2px] top-[1.34px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-0 h-1.5 left-[8px] top-[8px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-3 h-[3.33px] left-[2.19px] top-[4.67px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-1.5 h-[3.43px] left-[5px] top-[2.85px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                              <div className="self-stretch flex flex-col justify-start items-start">
                                 <div className="justify-start text-neutral-800 text-xl font-bold font-['Segoe_UI'] leading-6">Label advice</div>
                              </div>
                              <div className="self-stretch justify-start text-neutral-700 text-base font-normal font-['Segoe_UI']">
                                 Advice, bulk pricing, and custom options for Diamondlabels.
                              </div>
                           </div>
                        </div>
                        <div className="self-stretch inline-flex justify-start items-start gap-3">
                           <div className="size- pt-0.5 flex justify-start items-start">
                              <div className="size-8 bg-amber-500/10 rounded-full flex justify-center items-center">
                                 <div className="size-4 relative overflow-hidden">
                                    <div className="size-3.5 left-[1.33px] top-[1.33px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                    <div className="w-2 h-1.5 left-[6px] top-[2.67px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-amber-500"></div>
                                 </div>
                              </div>
                           </div>
                           <div className="w-[523px] inline-flex flex-col justify-start items-start gap-2">
                              <div className="self-stretch flex flex-col justify-start items-start">
                                 <div className="justify-start text-neutral-800 text-xl font-bold font-['Segoe_UI'] leading-6">Free sample pack</div>
                              </div>
                              <div className="self-stretch justify-start">
                                 <span className="text-amber-500 text-base font-bold font-['Segoe_UI'] underline">Request a free sample</span>
                                 <span className="text-neutral-700 text-base font-normal font-['Segoe_UI']"> to test quality before ordering.</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-slate-100"></div>
                     <div className="self-stretch inline-flex justify-start items-center gap-4">
                        <div className="flex-1 p-6 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex flex-col justify-start items-center gap-4">
                           <div className="self-stretch flex flex-col justify-center items-start gap-4">
                              <div className="self-stretch inline-flex justify-center items-center gap-3">
                                 <div>
                                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                       <path
                                          d="M15.9402 17C14.0557 17 12.1625 16.5618 10.2605 15.6855C8.35867 14.8092 6.61125 13.573 5.01825 11.977C3.42542 10.3808 2.19083 8.63333 1.3145 6.7345C0.438167 4.83583 0 2.94425 0 1.05975C0 0.756917 0.1 0.504583 0.3 0.30275C0.5 0.100916 0.75 0 1.05 0H4.3115C4.564 0 4.78675 0.082417 4.97975 0.24725C5.17275 0.411917 5.2955 0.615417 5.348 0.85775L5.92125 3.8C5.96092 4.073 5.95258 4.30758 5.89625 4.50375C5.83975 4.69992 5.73842 4.86467 5.59225 4.998L3.28275 7.24625C3.65442 7.92692 4.07908 8.57083 4.55675 9.178C5.03425 9.785 5.55125 10.3648 6.10775 10.9173C6.65642 11.4661 7.23975 11.9757 7.85775 12.4462C8.47575 12.9167 9.14308 13.3546 9.85975 13.7598L12.1038 11.4963C12.2603 11.3334 12.4498 11.2193 12.6723 11.1538C12.8946 11.0884 13.1257 11.0724 13.3655 11.1058L16.1423 11.6713C16.3948 11.7379 16.6008 11.8667 16.7605 12.0577C16.9202 12.2487 17 12.4654 17 12.7078V15.95C17 16.25 16.8991 16.5 16.6973 16.7C16.4954 16.9 16.2431 17 15.9402 17ZM2.573 5.827L4.35775 4.11925C4.38975 4.09358 4.41058 4.05833 4.42025 4.0135C4.42992 3.96867 4.42833 3.927 4.4155 3.8885L3.98075 1.65375C3.96792 1.60258 3.9455 1.56417 3.9135 1.5385C3.8815 1.51283 3.83983 1.5 3.7885 1.5H1.65C1.6115 1.5 1.57942 1.51283 1.55375 1.5385C1.52825 1.56417 1.5155 1.59625 1.5155 1.63475C1.56667 2.31808 1.6785 3.01225 1.851 3.71725C2.02333 4.42242 2.264 5.12567 2.573 5.827ZM11.273 14.4693C11.9358 14.7783 12.6272 15.0145 13.347 15.178C14.067 15.3413 14.7397 15.4384 15.3652 15.4693C15.4037 15.4693 15.4358 15.4564 15.4615 15.4307C15.4872 15.4051 15.5 15.373 15.5 15.3345V13.2308C15.5 13.1794 15.4872 13.1377 15.4615 13.1058C15.4358 13.0738 15.3974 13.0513 15.3462 13.0385L13.2462 12.6115C13.2077 12.5987 13.1741 12.5971 13.1453 12.6067C13.1164 12.6164 13.0859 12.6372 13.0538 12.6692L11.273 14.4693Z"
                                          fill="#888888"
                                       />
                                    </svg>
                                 </div>
                                 <div className="text-center justify-start text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">Call</div>
                              </div>
                              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                 <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-semibold font-['Segoe_UI'] leading-6">
                                    +31 (0)318 590 465
                                 </div>
                                 <div className="self-stretch text-center justify-start text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">
                                    Mon – Fri, 8:30 – 17:00
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex-1 p-6 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex flex-col justify-start items-center gap-4">
                           <div className="self-stretch inline-flex justify-center items-center gap-3">
                              <div>
                                 <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                       d="M1.80775 15C1.30258 15 0.875 14.825 0.525 14.475C0.175 14.125 0 13.6974 0 13.1923V1.80775C0 1.30258 0.175 0.875 0.525 0.525C0.875 0.175 1.30258 0 1.80775 0H17.1923C17.6974 0 18.125 0.175 18.475 0.525C18.825 0.875 19 1.30258 19 1.80775V13.1923C19 13.6974 18.825 14.125 18.475 14.475C18.125 14.825 17.6974 15 17.1923 15H1.80775ZM17.5 2.94225L9.9865 7.752C9.90967 7.7955 9.83017 7.82975 9.748 7.85475C9.666 7.87975 9.58333 7.89225 9.5 7.89225C9.41667 7.89225 9.334 7.87975 9.252 7.85475C9.16983 7.82975 9.09033 7.7955 9.0135 7.752L1.5 2.94225V13.1923C1.5 13.2821 1.52883 13.3558 1.5865 13.4135C1.64417 13.4712 1.71792 13.5 1.80775 13.5H17.1923C17.2821 13.5 17.3558 13.4712 17.4135 13.4135C17.4712 13.3558 17.5 13.2821 17.5 13.1923V2.94225ZM9.5 6.5L17.3463 1.5H1.65375L9.5 6.5ZM1.5 3.173V2.02975V2.0595V2.02775V3.173Z"
                                       fill="#888888"
                                    />
                                 </svg>
                              </div>
                              <div className="text-center justify-start text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">Email</div>
                           </div>
                           <div className="self-stretch flex flex-col justify-start items-center gap-2">
                              <div className="self-stretch text-center justify-start text-neutral-700 text-lg font-semibold font-['Segoe_UI'] leading-6">
                                 verkoop@businesslabels.nl
                              </div>
                              <div className="self-stretch text-center justify-start text-zinc-500 text-base font-normal font-['Segoe_UI'] leading-6">
                                 Response within 1 business day
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <ContactForm />
            </div>

            <div className="h-40"></div>

            <div className="w-full mx-auto px-40 py-32 bg-gray-50 inline-flex flex-col justify-start items-start gap-12">
               <div className="max-w-360 mx-auto self-stretch flex flex-col justify-start items-center gap-4">
                  <div className="self-stretch text-center justify-start text-neutral-800 text-4xl font-semibold font-['Segoe_UI'] leading-[48px]">
                     Our Amaizing Team
                  </div>
                  <div className="text-center justify-start text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-7">
                     No anonymous support desk. You always speak with the same specialist who knows your situation.
                  </div>
               </div>
               <div className="max-w-360 mx-auto self-stretch inline-flex flex-wrap justify-center items-stretch gap-6">
                  {teamMembers.map((member) => (
                     <div
                        key={member.id}
                        className="flex-1 min-w-[280px] px-6 py-10 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] inline-flex flex-col justify-center items-center gap-6"
                     >
                        <img
                           className="size-28 relative rounded-[230px] object-cover"
                           src={member.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f59e0b&color=fff`}
                           alt={member.name}
                        />
                        <div className="self-stretch flex flex-col justify-center items-center gap-5">
                           <div className="self-stretch flex flex-col justify-start items-start gap-2">
                              <div className="self-stretch text-center justify-start text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                                 {member.name}
                              </div>
                           </div>
                           {(member.email || member.phone) && (
                              <div className="self-stretch flex flex-col justify-start items-center gap-1">
                                 {member.email && (
                                    <a
                                       href={`mailto:${member.email}`}
                                       className="self-stretch text-center justify-start text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6 hover:text-amber-500"
                                    >
                                       {member.email}
                                    </a>
                                 )}
                                 {member.phone && (
                                    <a
                                       href={`tel:${member.phone}`}
                                       className="self-stretch text-center justify-start text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6 hover:text-amber-500"
                                    >
                                       {member.phone}
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
