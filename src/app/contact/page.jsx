import { getTranslations } from "next-intl/server";
import ReviewsSection from "@/components/ReviewsSection";
import ContactForm from "./ContactForm";

export default async function ContactPage() {
   const t = await getTranslations();
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
               <div className="max-w-360 mx-auto self-stretch inline-flex justify-start items-stretch gap-6">
                  <div className="flex-1 px-6 py-10 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] inline-flex flex-col justify-center items-center gap-6">
                     <img className="size-28 relative rounded-[230px]" src="https://placehold.co/120x120" />
                     <div className="self-stretch flex flex-col justify-center items-center gap-5">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                           <div className="self-stretch text-center justify-start text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                              Lars van den Berg
                           </div>
                           <div className="self-stretch text-center justify-start text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6">
                              Founder & Label Expert
                           </div>
                        </div>
                        <div className="self-stretch text-center justify-start text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">
                           15 years in inkjet label tech. Lars founded BusinessLabels to help small and medium businesses access the label industry.
                        </div>
                        <div className="size- inline-flex justify-center items-center gap-4">
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8108)"><path d="M24.1818 0H3.81818C2.80554 0 1.83437 0.402272 1.11832 1.11832C0.402272 1.83437 0 2.80554 0 3.81818L0 24.1818C0 25.1945 0.402272 26.1656 1.11832 26.8817C1.83437 27.5977 2.80554 28 3.81818 28H24.1818C25.1945 28 26.1656 27.5977 26.8817 26.8817C27.5977 26.1656 28 25.1945 28 24.1818V3.81818C28 2.80554 27.5977 1.83437 26.8817 1.11832C26.1656 0.402272 25.1945 0 24.1818 0ZM9.54545 22.1582C9.54566 22.2358 9.53055 22.3127 9.50098 22.3845C9.47142 22.4563 9.42797 22.5216 9.37314 22.5766C9.31832 22.6315 9.25318 22.6752 9.18147 22.7049C9.10975 22.7347 9.03287 22.75 8.95523 22.75H6.44C6.36222 22.7502 6.28517 22.735 6.21327 22.7054C6.14138 22.6757 6.07605 22.6321 6.02105 22.5771C5.96606 22.5221 5.92247 22.4568 5.8928 22.3849C5.86314 22.313 5.84797 22.236 5.84818 22.1582V11.6136C5.84818 11.4567 5.91053 11.3061 6.02152 11.1952C6.13251 11.0842 6.28304 11.0218 6.44 11.0218H8.95523C9.11191 11.0222 9.26203 11.0848 9.37268 11.1957C9.48332 11.3067 9.54545 11.457 9.54545 11.6136V22.1582ZM7.69682 10.0227C7.22484 10.0227 6.76346 9.88277 6.37103 9.62055C5.97859 9.35834 5.67272 8.98564 5.49211 8.54959C5.31149 8.11353 5.26423 7.63372 5.35631 7.17081C5.44839 6.7079 5.67567 6.28269 6.0094 5.94895C6.34314 5.61521 6.76835 5.38793 7.23126 5.29585C7.69417 5.20377 8.17399 5.25103 8.61004 5.43165C9.04609 5.61227 9.41879 5.91814 9.68101 6.31057C9.94322 6.70301 10.0832 7.16439 10.0832 7.63636C10.0832 8.26927 9.83176 8.87625 9.38423 9.32378C8.9367 9.77131 8.32972 10.0227 7.69682 10.0227ZM22.6927 22.1995C22.6929 22.2711 22.679 22.3419 22.6517 22.408C22.6245 22.4741 22.5844 22.5342 22.5338 22.5847C22.4833 22.6353 22.4232 22.6754 22.3571 22.7026C22.291 22.7299 22.2201 22.7438 22.1486 22.7436H19.4441C19.3726 22.7438 19.3017 22.7299 19.2356 22.7026C19.1695 22.6754 19.1095 22.6353 19.0589 22.5847C19.0083 22.5342 18.9683 22.4741 18.941 22.408C18.9137 22.3419 18.8998 22.2711 18.9 22.1995V17.2598C18.9 16.5216 19.1164 14.027 16.9702 14.027C15.3077 14.027 14.9689 15.7341 14.902 16.5009V22.2059C14.9021 22.3488 14.8458 22.486 14.7455 22.5879C14.6452 22.6897 14.5088 22.7479 14.3659 22.75H11.7536C11.6823 22.75 11.6116 22.7359 11.5457 22.7086C11.4797 22.6812 11.4199 22.6411 11.3695 22.5905C11.3191 22.54 11.2791 22.48 11.252 22.414C11.2248 22.348 11.2109 22.2773 11.2111 22.2059V11.5675C11.2109 11.4961 11.2248 11.4254 11.252 11.3594C11.2791 11.2934 11.3191 11.2334 11.3695 11.1829C11.4199 11.1323 11.4797 11.0922 11.5457 11.0649C11.6116 11.0375 11.6823 11.0234 11.7536 11.0234H14.3659C14.5102 11.0234 14.6486 11.0807 14.7506 11.1828C14.8527 11.2848 14.91 11.4232 14.91 11.5675V12.487C15.5273 11.5595 16.442 10.8468 18.3941 10.8468C22.7182 10.8468 22.6895 14.8845 22.6895 17.1023L22.6927 22.1995Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8108"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8118)"><path d="M14.9363 13.5212L21.2373 22.534H18.6514L13.5096 15.1796V15.1791L12.7547 14.0995L6.74829 5.50781H9.33424L14.1814 12.4416L14.9363 13.5212Z" fill="#888888" /><path d="M24.9745 0H3.02546C1.35459 0 0 1.35459 0 3.02546V24.9745C0 26.6454 1.35459 28 3.02546 28H24.9745C26.6454 28 28 26.6454 28 24.9745V3.02546C28 1.35459 26.6454 0 24.9745 0ZM17.8593 23.7445L12.6561 16.172L6.14174 23.7445H4.45809L11.9086 15.0844L4.45809 4.24108H10.1407L15.0677 11.4118L21.2364 4.24108H22.9201L15.8155 12.4996H15.8151L23.5419 23.7445H17.8593Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8118"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 px-6 py-10 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] inline-flex flex-col justify-center items-center gap-6">
                     <img className="size-28 relative rounded-[230px]" src="https://placehold.co/120x120" />
                     <div className="self-stretch flex flex-col justify-start items-center gap-5">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                           <div className="self-stretch text-center justify-start text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">Sophie Janssen</div>
                           <div className="self-stretch text-center justify-start text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6">
                              Technical Consultant
                           </div>
                        </div>
                        <div className="self-stretch text-center justify-start text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">
                           Sophie helps customers every day choose the right printer and label. She has guided over 200 installations from start to finish.
                        </div>
                        <div className="size- inline-flex justify-center items-center gap-4">
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8108)"><path d="M24.1818 0H3.81818C2.80554 0 1.83437 0.402272 1.11832 1.11832C0.402272 1.83437 0 2.80554 0 3.81818L0 24.1818C0 25.1945 0.402272 26.1656 1.11832 26.8817C1.83437 27.5977 2.80554 28 3.81818 28H24.1818C25.1945 28 26.1656 27.5977 26.8817 26.8817C27.5977 26.1656 28 25.1945 28 24.1818V3.81818C28 2.80554 27.5977 1.83437 26.8817 1.11832C26.1656 0.402272 25.1945 0 24.1818 0ZM9.54545 22.1582C9.54566 22.2358 9.53055 22.3127 9.50098 22.3845C9.47142 22.4563 9.42797 22.5216 9.37314 22.5766C9.31832 22.6315 9.25318 22.6752 9.18147 22.7049C9.10975 22.7347 9.03287 22.75 8.95523 22.75H6.44C6.36222 22.7502 6.28517 22.735 6.21327 22.7054C6.14138 22.6757 6.07605 22.6321 6.02105 22.5771C5.96606 22.5221 5.92247 22.4568 5.8928 22.3849C5.86314 22.313 5.84797 22.236 5.84818 22.1582V11.6136C5.84818 11.4567 5.91053 11.3061 6.02152 11.1952C6.13251 11.0842 6.28304 11.0218 6.44 11.0218H8.95523C9.11191 11.0222 9.26203 11.0848 9.37268 11.1957C9.48332 11.3067 9.54545 11.457 9.54545 11.6136V22.1582ZM7.69682 10.0227C7.22484 10.0227 6.76346 9.88277 6.37103 9.62055C5.97859 9.35834 5.67272 8.98564 5.49211 8.54959C5.31149 8.11353 5.26423 7.63372 5.35631 7.17081C5.44839 6.7079 5.67567 6.28269 6.0094 5.94895C6.34314 5.61521 6.76835 5.38793 7.23126 5.29585C7.69417 5.20377 8.17399 5.25103 8.61004 5.43165C9.04609 5.61227 9.41879 5.91814 9.68101 6.31057C9.94322 6.70301 10.0832 7.16439 10.0832 7.63636C10.0832 8.26927 9.83176 8.87625 9.38423 9.32378C8.9367 9.77131 8.32972 10.0227 7.69682 10.0227ZM22.6927 22.1995C22.6929 22.2711 22.679 22.3419 22.6517 22.408C22.6245 22.4741 22.5844 22.5342 22.5338 22.5847C22.4833 22.6353 22.4232 22.6754 22.3571 22.7026C22.291 22.7299 22.2201 22.7438 22.1486 22.7436H19.4441C19.3726 22.7438 19.3017 22.7299 19.2356 22.7026C19.1695 22.6754 19.1095 22.6353 19.0589 22.5847C19.0083 22.5342 18.9683 22.4741 18.941 22.408C18.9137 22.3419 18.8998 22.2711 18.9 22.1995V17.2598C18.9 16.5216 19.1164 14.027 16.9702 14.027C15.3077 14.027 14.9689 15.7341 14.902 16.5009V22.2059C14.9021 22.3488 14.8458 22.486 14.7455 22.5879C14.6452 22.6897 14.5088 22.7479 14.3659 22.75H11.7536C11.6823 22.75 11.6116 22.7359 11.5457 22.7086C11.4797 22.6812 11.4199 22.6411 11.3695 22.5905C11.3191 22.54 11.2791 22.48 11.252 22.414C11.2248 22.348 11.2109 22.2773 11.2111 22.2059V11.5675C11.2109 11.4961 11.2248 11.4254 11.252 11.3594C11.2791 11.2934 11.3191 11.2334 11.3695 11.1829C11.4199 11.1323 11.4797 11.0922 11.5457 11.0649C11.6116 11.0375 11.6823 11.0234 11.7536 11.0234H14.3659C14.5102 11.0234 14.6486 11.0807 14.7506 11.1828C14.8527 11.2848 14.91 11.4232 14.91 11.5675V12.487C15.5273 11.5595 16.442 10.8468 18.3941 10.8468C22.7182 10.8468 22.6895 14.8845 22.6895 17.1023L22.6927 22.1995Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8108"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8118)"><path d="M14.9363 13.5212L21.2373 22.534H18.6514L13.5096 15.1796V15.1791L12.7547 14.0995L6.74829 5.50781H9.33424L14.1814 12.4416L14.9363 13.5212Z" fill="#888888" /><path d="M24.9745 0H3.02546C1.35459 0 0 1.35459 0 3.02546V24.9745C0 26.6454 1.35459 28 3.02546 28H24.9745C26.6454 28 28 26.6454 28 24.9745V3.02546C28 1.35459 26.6454 0 24.9745 0ZM17.8593 23.7445L12.6561 16.172L6.14174 23.7445H4.45809L11.9086 15.0844L4.45809 4.24108H10.1407L15.0677 11.4118L21.2364 4.24108H22.9201L15.8155 12.4996H15.8151L23.5419 23.7445H17.8593Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8118"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 px-6 py-10 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] inline-flex flex-col justify-center items-center gap-6">
                     <img className="size-28 relative rounded-[230px]" src="https://placehold.co/120x120" />
                     <div className="self-stretch flex flex-col justify-start items-center gap-5">
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                           <div className="self-stretch text-center justify-start text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                              Lars van den Berg
                           </div>
                           <div className="self-stretch text-center justify-start text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6">
                              Account Manager
                           </div>
                        </div>
                        <div className="self-stretch text-center justify-start text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-6">
                           Tim handles large orders and custom solutions for production companies. His focus is on building long-term partnerships with clients.
                        </div>
                        <div className="size- inline-flex justify-center items-center gap-4">
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8108)"><path d="M24.1818 0H3.81818C2.80554 0 1.83437 0.402272 1.11832 1.11832C0.402272 1.83437 0 2.80554 0 3.81818L0 24.1818C0 25.1945 0.402272 26.1656 1.11832 26.8817C1.83437 27.5977 2.80554 28 3.81818 28H24.1818C25.1945 28 26.1656 27.5977 26.8817 26.8817C27.5977 26.1656 28 25.1945 28 24.1818V3.81818C28 2.80554 27.5977 1.83437 26.8817 1.11832C26.1656 0.402272 25.1945 0 24.1818 0ZM9.54545 22.1582C9.54566 22.2358 9.53055 22.3127 9.50098 22.3845C9.47142 22.4563 9.42797 22.5216 9.37314 22.5766C9.31832 22.6315 9.25318 22.6752 9.18147 22.7049C9.10975 22.7347 9.03287 22.75 8.95523 22.75H6.44C6.36222 22.7502 6.28517 22.735 6.21327 22.7054C6.14138 22.6757 6.07605 22.6321 6.02105 22.5771C5.96606 22.5221 5.92247 22.4568 5.8928 22.3849C5.86314 22.313 5.84797 22.236 5.84818 22.1582V11.6136C5.84818 11.4567 5.91053 11.3061 6.02152 11.1952C6.13251 11.0842 6.28304 11.0218 6.44 11.0218H8.95523C9.11191 11.0222 9.26203 11.0848 9.37268 11.1957C9.48332 11.3067 9.54545 11.457 9.54545 11.6136V22.1582ZM7.69682 10.0227C7.22484 10.0227 6.76346 9.88277 6.37103 9.62055C5.97859 9.35834 5.67272 8.98564 5.49211 8.54959C5.31149 8.11353 5.26423 7.63372 5.35631 7.17081C5.44839 6.7079 5.67567 6.28269 6.0094 5.94895C6.34314 5.61521 6.76835 5.38793 7.23126 5.29585C7.69417 5.20377 8.17399 5.25103 8.61004 5.43165C9.04609 5.61227 9.41879 5.91814 9.68101 6.31057C9.94322 6.70301 10.0832 7.16439 10.0832 7.63636C10.0832 8.26927 9.83176 8.87625 9.38423 9.32378C8.9367 9.77131 8.32972 10.0227 7.69682 10.0227ZM22.6927 22.1995C22.6929 22.2711 22.679 22.3419 22.6517 22.408C22.6245 22.4741 22.5844 22.5342 22.5338 22.5847C22.4833 22.6353 22.4232 22.6754 22.3571 22.7026C22.291 22.7299 22.2201 22.7438 22.1486 22.7436H19.4441C19.3726 22.7438 19.3017 22.7299 19.2356 22.7026C19.1695 22.6754 19.1095 22.6353 19.0589 22.5847C19.0083 22.5342 18.9683 22.4741 18.941 22.408C18.9137 22.3419 18.8998 22.2711 18.9 22.1995V17.2598C18.9 16.5216 19.1164 14.027 16.9702 14.027C15.3077 14.027 14.9689 15.7341 14.902 16.5009V22.2059C14.9021 22.3488 14.8458 22.486 14.7455 22.5879C14.6452 22.6897 14.5088 22.7479 14.3659 22.75H11.7536C11.6823 22.75 11.6116 22.7359 11.5457 22.7086C11.4797 22.6812 11.4199 22.6411 11.3695 22.5905C11.3191 22.54 11.2791 22.48 11.252 22.414C11.2248 22.348 11.2109 22.2773 11.2111 22.2059V11.5675C11.2109 11.4961 11.2248 11.4254 11.252 11.3594C11.2791 11.2934 11.3191 11.2334 11.3695 11.1829C11.4199 11.1323 11.4797 11.0922 11.5457 11.0649C11.6116 11.0375 11.6823 11.0234 11.7536 11.0234H14.3659C14.5102 11.0234 14.6486 11.0807 14.7506 11.1828C14.8527 11.2848 14.91 11.4232 14.91 11.5675V12.487C15.5273 11.5595 16.442 10.8468 18.3941 10.8468C22.7182 10.8468 22.6895 14.8845 22.6895 17.1023L22.6927 22.1995Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8108"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                           <div className="size-7 relative overflow-hidden">
                              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_2508_8118)"><path d="M14.9363 13.5212L21.2373 22.534H18.6514L13.5096 15.1796V15.1791L12.7547 14.0995L6.74829 5.50781H9.33424L14.1814 12.4416L14.9363 13.5212Z" fill="#888888" /><path d="M24.9745 0H3.02546C1.35459 0 0 1.35459 0 3.02546V24.9745C0 26.6454 1.35459 28 3.02546 28H24.9745C26.6454 28 28 26.6454 28 24.9745V3.02546C28 1.35459 26.6454 0 24.9745 0ZM17.8593 23.7445L12.6561 16.172L6.14174 23.7445H4.45809L11.9086 15.0844L4.45809 4.24108H10.1407L15.0677 11.4118L21.2364 4.24108H22.9201L15.8155 12.4996H15.8151L23.5419 23.7445H17.8593Z" fill="#888888" /></g><defs><clipPath id="clip0_2508_8118"><rect width="28" height="28" fill="white" /></clipPath></defs></svg>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <ReviewsSection />
      </>
   );
}
