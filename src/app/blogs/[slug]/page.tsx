import Image from "next/image";
import Link from "next/link";

export default function SingleBlogPage() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-0 top-[454px] h-48 w-48 rounded-full bg-amber-500/30 blur-[132px]" />
      <div className="pointer-events-none absolute left-[1312px] top-[858px] h-48 w-48 rounded-full bg-amber-500/30 blur-[132px]" />

      <div className="mx-auto flex max-w-360 flex-col gap-24 pt-10 pb-24 px-4 sm:px-6 lg:px-0">
        
        {/* Main Content Area */}
        <div className="flex flex-col items-start gap-10">
          
          {/* Header Section */}
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex flex-col items-start gap-4">
              <div className="inline-flex items-center gap-2 h-4">
                <div className="h-4 w-4 bg-zinc-300"></div>
                <div className="h-2.5 w-2.5 bg-zinc-500"></div>
                <span className="text-sm font-normal leading-5 text-zinc-500">/</span>
                <Link href="/blogs" className="text-sm font-normal leading-5 text-zinc-500 hover:text-amber-500">Blogs</Link>
                <span className="text-sm font-normal leading-5 text-zinc-500">/</span>
                <span className="text-sm font-semibold leading-5 text-neutral-700">Details</span>
              </div>
              <h1 className="text-4xl font-bold leading-[48px] text-neutral-800">
                Label design: which design software to use?
              </h1>
            </div>
            
            <div className="relative h-[580px] w-full overflow-hidden rounded-xl">
              <Image 
                src="https://placehold.co/1200x850" 
                alt="Label design software"
                fill
                className="object-cover bg-black/30"
                unoptimized
              />
              <div className="absolute left-[24px] top-[387px] inline-flex w-[1152px] flex-col items-start gap-4 rounded-lg bg-white/90 p-6 backdrop-blur-[2px]">
                <p className="text-lg font-semibold leading-7 text-neutral-700">
                  Explore and compare the top label design software options tailored to your specific needs. Whether you're looking for free tools or advanced professional solutions, discover the perfect match to enhance and streamline your workflow efficiently.
                </p>
                <div className="inline-flex items-start gap-6">
                  <div className="inline-flex flex-col items-start gap-1.5">
                    <span className="text-sm font-normal leading-5 text-neutral-700">Author:</span>
                    <div className="inline-flex items-center gap-1.5">
                      <Image src="https://placehold.co/24x24" alt="Author" width={24} height={24} className="rounded-full" unoptimized />
                      <span className="text-base font-semibold leading-6 text-neutral-800">Kathryn Murphy</span>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-gray-100"></div>
                  <div className="inline-flex flex-col items-start gap-1.5">
                    <span className="text-sm font-normal leading-5 text-neutral-700">Published on:</span>
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-6 w-6 bg-zinc-300"></div>
                      <div className="h-5 w-4 bg-neutral-800"></div>
                      <span className="text-base font-semibold leading-6 text-neutral-800">26 Dec 2025</span>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-gray-100"></div>
                  <div className="inline-flex flex-col items-start gap-1.5">
                    <span className="text-sm font-normal leading-5 text-neutral-700">Category:</span>
                    <div className="inline-flex items-start justify-center gap-2.5 rounded-[100px] bg-neutral-800/10 px-3 h-6 border border-neutral-800/10">
                      <span className="text-base font-semibold leading-5 text-neutral-800">Technology</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex w-full items-start gap-10">
            {/* Article Content */}
            <article className="flex flex-1 flex-col items-start gap-8">
              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-3xl font-bold leading-10 text-neutral-800">Design labels for your inkjet label printer</h2>
                <p className="text-base font-normal leading-6 text-neutral-700">
                  If you have a color label printer, you can print striking and eye-catching labels. Consequently, we regularly receive questions about which design software we would recommend for easily designing beautiful labels yourself. We work with Adobe Creative Cloud applications ourselves and primarily use Illustrator. This software is likely too complex and too expensive for some small to medium-sized businesses for the application we have in mind. Adobe Creative Cloud is the number one in various industries and offers virtually all the tools you need as a designer, but learning all the apps is difficult and unnecessary for the application we have in mind. So, we went looking for a program with a reasonable learning curve and sufficient tools to design a beautiful label.
                </p>
              </div>

              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-3xl font-bold leading-10 text-neutral-800">The search for the right label design software</h2>
                <div className="inline-flex w-full items-start gap-4">
                  <p className="flex-1 text-base font-normal leading-6 text-neutral-700">
                    To provide sound advice, we delved into the various solutions the market offers. To our surprise, there were more options than expected across different segments… from free design software to subscriptions of +/- €60 per month.<br /><br />
                    To ensure everyone receives suitable advice, we have compared software across multiple price ranges. Please bear in mind that I, Levi van der Molen, have been working with Illustrator since Adobe CS4 (around 2008) and will be looking at various alternatives from this perspective.
                  </p>
                  <Image src="https://placehold.co/412x288" alt="Software search" width={412} height={288} className="flex-1 rounded-xl object-cover" unoptimized />
                </div>
                <p className="text-base font-normal leading-6 text-neutral-700">
                  This post is not written for professionals who want to know which package handles ICC profiles, color management, teamwork, etc., best, but rather for users of a color label printer who, with little or no experience, want to create beautiful labels to print with, for example, their Epson ColorWorks printer.
                </p>
              </div>

              <div className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full flex-col items-start gap-4">
                  <h2 className="text-3xl font-bold leading-10 text-neutral-800">Testimonial: AmSpec [ GHS BS6509 TM-C3500 ]</h2>
                  <p className="text-base font-normal leading-6 text-neutral-700">
                    Our customer AmSpec shares their experience with the Epson ColorWorks TM-C3500 for printing chemical-resistant labels.
                  </p>
                  <p className="text-base font-normal leading-6 text-neutral-700">
                    Amspec is a global organization that provides independent inspections for the Petroleum, Gas, and Chemical industries. The Epson ColorWorks offer the ideal solution for printing GHS symbols according to the correct guidelines, ensuring that the labels and print are resistant to the chemical agents they use. They also comply with the BS5609 standard when required for sea transport.
                  </p>
                </div>
                <Image src="https://placehold.co/840x473" alt="Testimonial" width={840} height={473} className="h-[472.50px] w-full rounded-xl object-cover" unoptimized />
              </div>

              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-3xl font-bold leading-10 text-neutral-800">On which aspects do we compare the “label design software”?</h2>
                <p className="text-base font-normal leading-6 text-neutral-700">
                  In my opinion, label design varies as far as your own creativity, but a label generally consists of mainly 3 elements.
                </p>
              </div>

              {/* Photos Section */}
              <div className="flex w-full flex-col items-start gap-4">
                <h3 className="text-3xl font-bold leading-10 text-neutral-800">Photos (pixels)</h3>
                <div className="inline-flex w-full items-start gap-4">
                  <p className="flex-1 text-base font-normal leading-6 text-neutral-700">
                    Photos are often seen on labels, especially on retail packaging labels where the product is depicted on the packaging. (expectation) Photos on the product label are used to evoke an emotion and/or atmosphere in a product. (product experience)<br />
                    Please note that you cannot enlarge photos/pixels beyond the original without loss. Photos are made up of pixels (small blocks of color) that we need to be able to edit with the software.<br /><br />
                    - adjusting colors<br />
                    - cut out from background<br />
                    - can produce certain effects and transparency
                  </p>
                  <Image src="https://placehold.co/220x220" alt="Photos" width={220} height={220} className="h-56 w-56 rounded-2xl border border-gray-100 shadow-sm" unoptimized />
                </div>
              </div>

              {/* Illustrations Section */}
              <div className="flex w-full flex-col items-start gap-4">
                <h3 className="text-3xl font-bold leading-10 text-neutral-800">Illustrations (vectors)</h3>
                <div className="inline-flex w-full items-start gap-4">
                  <p className="flex-1 text-base font-normal leading-6 text-neutral-700">
                    Logos, illustrations, shapes, etc. that we use in designing a label are created as vector files.<br />
                    Unlike the pixels of a photo, vector files are composed of lines with mathematical calculations that form an image or illustration. This means that vectors can be enlarged infinitely without loss of quality, and it also ensures that the files can remain very small while still remaining editable.<br />
                    When you have the choice to create a file as pixels or as a vector, I would always advise working with vectors due to their editability and quality compared to pixels. Exceptions prove the rule, such as color gradients.<br /><br />
                    - Pen tool For freehand drawing of paths, shapes, and illustrations and the tools to manipulate paths<br />
                    - Standard shapes Star, square, polygon etc.<br />
                    - Vector Brush
                  </p>
                  <Image src="https://placehold.co/220x220" alt="Vectors" width={220} height={220} className="h-56 w-56 rounded-2xl border border-gray-100 shadow-sm" unoptimized />
                </div>
              </div>

              {/* Text Section */}
              <div className="flex w-full flex-col items-start gap-4">
                <h3 className="text-3xl font-bold leading-10 text-neutral-800">Text</h3>
                <div className="inline-flex w-full items-start gap-4">
                  <div className="flex flex-1 flex-col justify-center items-start gap-4">
                    <p className="text-base font-normal leading-6 text-neutral-700">
                      A very undervalued element of a label is the way text is placed and how it remains consistent across all labels. Often, novice designers are more focused on all the other components of a label, and text is simply crammed in as a necessary extra. However, text is particularly important for labels, especially for uniformity across your entire label line.<br />
                      Personally, I start a design specifically with the text so that I can accurately estimate how much space I need for it, and how and where best to allocate it. This begins with the fonts we use in our corporate identity and carrying them through to the labels, before determining the font size, weights, and paragraph styles.<br /><br />
                      - drawing styles<br />
                      - paragraph styles<br />
                      - convert text to outlines (vector paths)<br />
                      - font options
                    </p>
                    <div className="flex w-full flex-col items-start gap-1.5">
                      <h4 className="text-2xl font-semibold leading-7 text-neutral-800">What is a corporate identity?</h4>
                      <p className="text-base font-normal leading-6 text-neutral-700">
                        Elements through which a company presents itself in the market. A corporate identity is determined, among other things, by establishing: the logo, the colors, the typeface, and specific layouts and methods of their use.
                      </p>
                    </div>
                  </div>
                  <Image src="https://placehold.co/220x220" alt="Text" width={220} height={220} className="h-56 w-56 rounded-2xl border border-gray-100 shadow-sm" unoptimized />
                </div>
              </div>

              {/* Conclusion Section */}
              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-3xl font-bold leading-10 text-neutral-800">Conclusion: who is the best designer?</h2>
                <p className="text-base font-normal leading-6 text-neutral-700">
                  It surprised me that so much is happening in the field of graphic software (design software). I myself have extensive experience with Adobe Creative Cloud products and was under the impression that this is by far the best choice. I will not switch to other software myself because I am used to Illustrator and can no longer do without certain features, and because it is the standard in the industry we operate in. Nevertheless, I am pleasantly surprised by the alternatives, especially those in the lower segment, which nowadays do not fall too far short of the major players.<br />
                  Initially, I was going to include Inkscape as the free option, but I was greatly surprised to learn about Gravit Designer and ultimately decided to include it in the comparison. Gravit Designer is a very clear and modern application for creating vector files; the in-browser editor also pleasantly surprised me as an extra option.<br />
                  To be able to provide good advice, I have divided this into 2 segments.
                </p>
              </div>

              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-3xl font-bold leading-10 text-neutral-800">The professional market:</h2>
                <div className="inline-flex w-full items-start gap-4">
                  <p className="flex-1 text-base font-normal leading-6 text-neutral-700">
                    Here, I will end up with my trusted Adobe Creative Cloud apps. Probably because this is the “standard” and, with many specially developed apps, you really have all the tools at your disposal. The file formats are almost always accepted in the industry, so you can easily collaborate or have adjustments made. On the other hand, I find CorelDRAW has changed enormously since my last experience with it. They have developed several tools that Illustrator does not have, which pleasantly speed up and simplify your workflow—such as straightening a photo or adjusting perspective in just a few clicks—and you have various basic functions and tools at your disposal for pixel and vector editing.
                  </p>
                  <Image src="https://placehold.co/412x336" alt="Professional market" width={412} height={336} className="flex-1 rounded-xl object-cover" unoptimized />
                </div>
                <p className="text-base font-normal leading-6 text-neutral-700">
                  If you do want to scale up to the professional segment, I would say go for the Adobe Creative Cloud apps. However, it is nice to see a company like CorolDRAW in the market to put some pressure on innovations at Adobe.
                </p>
              </div>

              <p className="text-base font-normal leading-6 text-neutral-700">
                To create a beautiful label, you need less than 5% of the tools offered by the Adobe Creative Cloud apps. Of course, you do want to be able to use the basics of the various apps to creatively combine pixels, vectors, and text into a beautiful label and adjust them when necessary.<br />
                Personally, I think Gravit will suffice in many cases, but it falls short when it comes to pixel editing. Because Gravit Designer is free, you can also use it within the company for many other applications, such as social media, presentations, illustrations, etc.<br />
                However, I think that for just €55, Affinity Designer offers added value, especially due to the pixel tools that Gravit lacks. Furthermore, it is a very complete package in every respect, especially for that price, and works very well in conjunction with Gravit Designer for other applications. If you have created all graphic elements in Affinity Designer, they can still be used in Gravit Designer. This way, you can use the free Gravit Designer alongside Affinity Designer for social media, presentations, illustrations, etc. With Affinity Designer, you have a complete designer package in your hands.<br />
                Of course, there is always only one way to find out which software suits you best… working with it! Fortunately, all the options above are free to try out and, in the case of Gravit Designer, free to use.
              </p>

              {/* Author Bio Box */}
              <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold leading-7 text-neutral-800">About the Author</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="inline-flex w-full items-center gap-4">
                  <Image src="https://placehold.co/156x156" alt="Author" width={156} height={156} className="rounded-lg object-cover" unoptimized />
                  <div className="flex flex-1 flex-col items-start gap-2.5">
                    <h4 className="text-3xl font-bold leading-10 text-neutral-800 line-clamp-1">Levi van der Molen</h4>
                    <p className="text-lg font-semibold leading-7 text-neutral-700">
                      Support and production specialist at Smart2b. With a passion for design and experience in the technical aspects of production & support, I would be happy to advise and assist you with great enthusiasm. Furthermore, I am a big fan of Epson products for the graphics market.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar Area */}
            <aside className="inline-flex w-80 flex-col items-start gap-7 shrink-0">
              {/* Share Box */}
              <div className="relative flex w-full flex-col items-start gap-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="absolute left-0 top-0 h-14 w-80 bg-gray-100"></div>
                <h3 className="relative z-10 text-xl font-semibold leading-6 text-neutral-800">Share this page</h3>
                <div className="relative z-10 flex w-full flex-col items-start gap-5">
                  <div className="inline-flex items-center gap-5">
                    {/* Social icons placeholder */}
                    <div className="h-8 w-8 bg-amber-500/20 rounded"></div>
                    <div className="h-8 w-8 bg-amber-500/20 rounded"></div>
                    <div className="h-8 w-8 bg-amber-500/20 rounded"></div>
                    <div className="h-8 w-8 bg-amber-500/20 rounded"></div>
                  </div>
                  <div className="relative h-11 w-full">
                    <div className="absolute left-0 top-0 h-11 w-full rounded-md border border-gray-100 bg-white"></div>
                    <p className="absolute left-[14px] top-[12px] w-56 truncate text-sm font-normal leading-5 text-neutral-700">
                      https://businesslabel.com/blog/label-design
                    </p>
                    <div className="absolute right-4 top-3.5 h-4 w-4 cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.6667 4.66667H6V11.3333H12.6667V4.66667Z" stroke="#71717A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.33333 11.3333V4C3.33333 3.63333 3.63333 3.33333 4 3.33333H10" stroke="#71717A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Box */}
              <div className="relative flex w-full flex-col items-start gap-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="absolute left-0 top-0 h-14 w-80 bg-gray-100"></div>
                <h3 className="relative z-10 text-xl font-semibold leading-6 text-neutral-800">Categories</h3>
                <div className="relative z-10 flex w-full flex-col items-start gap-4">
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Recommendations</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Comparisons</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Product News</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Tips & Tricks</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Technology</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Use Case</Link>
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="#" className="text-base font-semibold leading-6 text-neutral-700 hover:text-amber-500">Tutorial</Link>
                </div>
              </div>

              {/* Recommended Post Box */}
              <div className="relative flex w-full flex-col items-start gap-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="absolute left-0 top-0 h-14 w-80 bg-gray-100"></div>
                <h3 className="relative z-10 text-xl font-semibold leading-6 text-neutral-800">Recommended Post</h3>
                <div className="relative z-10 flex w-full flex-col items-start gap-4">
                  {[
                    "Epson ColorWorks C7500: Complete FAQ Guide",
                    "Label Design Software: Which Tool Should You Use?",
                    "GHS Chemical Labeling: Complete Compliance Guide",
                    "New: Epson ColorWorks C4000 Series Launched",
                    "Freezer Labels: Material Selection for Cold Storage"
                  ].map((post, idx) => (
                    <div key={idx} className="flex w-full flex-col gap-4">
                      <Link href="#" className="group inline-flex w-full items-center gap-2.5">
                        <Image src={`https://placehold.co/52x62?text=${idx+1}`} alt="Post thumbnail" width={52} height={62} className="rounded object-cover" unoptimized />
                        <div className="flex flex-1 flex-col items-start gap-1">
                          <p className="text-base font-semibold leading-5 text-neutral-700 line-clamp-2 group-hover:text-amber-500">
                            {post}
                          </p>
                          <div className="inline-flex items-center gap-1">
                            <div className="h-4 w-4 bg-zinc-300"></div>
                            <div className="h-3 w-3 bg-zinc-500"></div>
                            <span className="text-sm font-normal leading-5 text-zinc-500">26 Dec 2025</span>
                          </div>
                        </div>
                      </Link>
                      {idx < 4 && <div className="w-full border-t border-gray-100"></div>}
                    </div>
                  ))}
                  <div className="w-full border-t border-gray-100"></div>
                  <Link href="/blogs" className="w-full text-center text-base font-semibold text-amber-500 hover:text-amber-600">
                    View More
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      {/* Recommended Products */}
      <div className="flex w-full flex-col items-start gap-12 bg-gray-50 px-4 py-24 sm:px-6 lg:px-40">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Recommended Products</h2>
          <div className="flex items-center gap-6">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-neutral-800 shadow-sm transition-colors hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-amber-500 text-amber-500 shadow-sm transition-colors hover:bg-amber-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mx-auto inline-flex w-full max-w-[1200px] items-start gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex w-[384px] shrink-0 flex-col items-start overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-60 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <Image src="https://placehold.co/222x180" alt="Product" width={222} height={180} unoptimized />
                <div className="absolute left-4 top-4 flex w-[calc(100%-32px)] items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-3xl bg-white px-2.5 py-1">
                    <div className="h-3 w-3 rounded-full bg-neutral-700/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-700"></div>
                    </div>
                    <span className="text-xs font-normal leading-4 text-neutral-700">Inkjet</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-[5px]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs font-normal leading-4 text-white">In Stock</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-4 p-4 shadow-sm">
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-sm font-normal leading-5 text-blue-400">SKU: EP-C3500</span>
                    <h3 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">
                      CW-C4000 ink cartridge Black (BK)
                    </h3>
                  </div>
                  <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-base font-normal leading-5 text-neutral-700">Ink content: 50 ml</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-base font-normal leading-5 text-neutral-700">Color system: CMYK</span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="w-full border-t border-gray-100"></div>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-2xl font-bold leading-7 text-neutral-800">€9,34</span>
                      <span className="text-xs font-normal leading-4 text-zinc-500">ex. VAT</span>
                    </div>
                    <button className="flex h-9 items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 transition-colors hover:bg-amber-600">
                      <span className="text-base font-semibold leading-6 text-white">Add</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.16667V15.8333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.16669 10H15.8334" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Materials */}
      <div className="flex w-full flex-col items-start gap-12 bg-white px-4 py-24 sm:px-6 lg:px-40">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Recommended Materials</h2>
          <div className="flex items-center gap-6">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-neutral-800 shadow-sm transition-colors hover:bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-amber-500 text-amber-500 shadow-sm transition-colors hover:bg-amber-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mx-auto inline-flex w-full max-w-[1200px] items-start gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex w-[384px] shrink-0 flex-col items-start overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                <Image src="https://placehold.co/384x220" alt="Material" width={384} height={220} className="w-full object-cover" unoptimized />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-3xl bg-white px-2.5 py-1">
                  <div className="h-3 w-3 rounded-full bg-neutral-700/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-700"></div>
                  </div>
                  <span className="text-xs font-normal leading-4 text-neutral-700">Inkjet</span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-4 p-4">
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-sm font-normal leading-5 text-blue-400">DIA055</span>
                    <h3 className="line-clamp-1 text-xl font-semibold leading-6 text-neutral-800">
                      Matte Paper permanent adhesive.
                    </h3>
                    <p className="line-clamp-2 text-base font-normal leading-5 text-neutral-700">
                      The Diamondlabels DIA055 is an extremely versatile matte inkjet material with favorable pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 items-center justify-center rounded-xl bg-orange-100 px-3">
                    <span className="text-sm font-normal leading-4 text-amber-500">Paper</span>
                  </div>
                  <div className="flex h-6 items-center justify-center rounded-xl bg-purple-100 px-3">
                    <span className="text-sm font-normal leading-4 text-purple-600">Glossy</span>
                  </div>
                  <div className="flex h-6 items-center justify-center rounded-xl bg-green-100 px-3">
                    <span className="text-sm font-normal leading-4 text-green-600">Permanent</span>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="w-full border-t border-gray-100"></div>
                  <div className="flex w-full items-start gap-2">
                    <div className="flex-1">
                      <span className="text-base font-normal leading-5 text-neutral-700">Weight: </span>
                      <span className="text-base font-semibold leading-5 text-neutral-700">165 g/m²</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-base font-normal leading-5 text-neutral-700">Thickness: </span>
                      <span className="text-base font-semibold leading-5 text-neutral-700">169 μm</span>
                    </div>
                  </div>
                  <button className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 transition-colors hover:bg-amber-600">
                    <span className="text-base font-semibold leading-6 text-white">View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative h-80 w-full overflow-hidden bg-black/20">
        <div className="absolute left-0 top-0 h-80 w-full bg-gradient-to-l from-black/50 via-black/50 to-transparent"></div>
        <div className="absolute left-0 top-0 h-80 w-full bg-gradient-to-br from-stone-700/70 to-yellow-950/60"></div>
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center text-4xl font-bold leading-[48px] text-white">
              Ready to find the perfect labels?
            </h2>
            <p className="text-center text-lg font-normal leading-7 text-gray-100">
              Join over 12,000 businesses who trust us for expert advice and high-quality products
            </p>
          </div>
          <div className="inline-flex items-center gap-4">
            <Link href="/finder" className="flex h-12 items-center justify-center gap-2.5 rounded-[50px] bg-amber-500 px-7 py-4 transition-colors hover:bg-amber-600">
              <span className="text-center text-lg font-semibold leading-6 text-white">Product Finder</span>
            </Link>
            <Link href="/custom" className="flex h-12 items-center justify-center gap-2.5 rounded-[50px] bg-white/10 px-7 py-4 border border-white/20 backdrop-blur-[5px] transition-colors hover:bg-white/20">
              <span className="text-center text-lg font-semibold leading-6 text-white">Custom-made Labels</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
