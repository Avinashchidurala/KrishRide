import {useState} from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { Box, MobileStepper, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import images from "../assets/images";
import PublicLayout from "../components/layouts/PublicLayout";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HubIcon from "@mui/icons-material/Hub";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

/**
 * Production-ready Careers Page
 * - Tailwind CSS for 95% styling/layout
 * - MUI used ONLY for IconButton + icons
 * - Fully responsive (mobile-first)
 */
export default function CareersPage() {

    const benefits = [
  {
    icon: RocketLaunchIcon,
    title: "Build Fast. Own Big.",
    description:
      "Build from zero to one in a founder-led, execution-driven startup. Your work ships fast and impacts thousands of real journeys across India.",
  },
  {
    icon: AssignmentTurnedInIcon,
    title: "Real Ownership, Not Just Titles",
    description:
      "From day one, you own meaningful problems — not just tasks. Your ideas don’t sit in documents; they go live, get tested, and evolve.",
  },
  {
    icon: HubIcon,
    title: "Learn Across the Business",
    description:
      "Roles aren’t boxed in. Get hands-on exposure to product, growth, operations, and customer behavior — true startup learning.",
  },
  {
    icon: FavoriteIcon,
    title: "Work With Purpose",
    description:
      "Solve real challenges in intercity travel — safety, trust, and fairness — especially for women and first-time travelers.",
  },
  {
    icon: TrendingUpIcon,
    title: "Grow as the Company Grows",
    description:
      "This is an early-stage journey. People who take initiative, think like owners, and execute well grow rapidly with the company.",
  },
];
     const testimonials = [
    {
      quote:
      "Working with the HushRyd team has been a learning experience. The way safety and responsibility are treated here is something I truly value.",
      author: "Avinash",
      role: "Software Developer",
      image:images.TeamMember4
    },
    {
      quote:
      "HushRyd is built with a clear focus on safety, trust, and user comfort. It feels good to work on something that truly matters",
      author: "Sneha",
      role: "HR Executive",
      image:images.TeamMember1
    },
    {
      quote:
      "At HushRyd, safety isn’t just a feature, it’s the foundation. Seeing how much care goes into building this platform makes me proud to be part of the team.",
          author: "Prajna",
      role: "Software Developer",
      image:images.TeamMember2
    },
    {
      quote:
      "HushRyd has been Home for me. Pleasant multicultural environment and the enthusiasm which everyone around carries is infectious. Proud to be a part of HushRyd.",
      author: "Surya",
      role: "Frontend Developer",
      image:images.TeamMember6
    },
    {
      quote:
      "What I like about HushRyd is the genuine effort the team puts into safety and reliability. It’s not just about rides, it’s about giving people confidence while they travel",
      author: "Rohan",
      role: "Software Developer", 
      image:images.TeamMember3
    },
    {
      quote:
      "Being involved in HushRyd has helped me understand how much impact a safety-first approach can make in everyday commuting",
      author: "Gayathri",
      role: "Manual Tester",
      image:images.TeamMember5
    },
    
   ]
  const [currentIndex, setCurrentIndex] = useState(0)
  const theme = useTheme();
const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

const itemsPerPage = isDesktop ? 2 : 1;
const maxSteps = Math.ceil(testimonials.length / itemsPerPage);
const [activeStep, setActiveStep] = useState(0);

const visibleTestimonials = testimonials.slice(
  activeStep * itemsPerPage,
  activeStep * itemsPerPage + itemsPerPage
);


  return (
    <PublicLayout>
    <div className="px-6 lg:px-20 xl:px-40 py-12 md:py-15 flex justify-center">
      <div className="max-w-[1280px] w-full">
        <div className="flex flex-col-reverse md:flex-row gap-12 items-center">
          <div className="flex flex-col gap-8 w-full md:w-1/2">
            <div className="flex flex-col gap-4">
              <span className="text-[#FF6B35] font-bold tracking-widest uppercase text-sm">Join the revolution</span>
              <h1 className="text-[#181811]  text-5xl font-black">
                Be a part of our team
              </h1>
              <p className="text-[#5a5a40]  text-lg lg:text-xl font-medium leading-relaxed max-w-lg">
                Join us in building the future of technology with a team that values innovation, diversity, and rapid
                growth.
              </p>
            </div>
            {/* <div className="flex flex-wrap gap-4">
              <button className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-orange-500 text-[#fafafa] text-lg font-bold shadow-xl hover:translate-y-[-2px] transition-all">
                View Jobs
              </button>
            </div> */}
          </div>
          <div className="w-full md:w-1/2">
            <div
              className="aspect-square bg-center bg-cover rounded-xl shadow-2xl relative overflow-hidden"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAZ58QpWufl5G3u0brmgjNQbge-7sc9woCvRqQm_n2xzmuoQ2Hb7PS1zSST9ejYP-KfAD5s3AxYXe9Ymde-Gd0HaxdWjWbPo6Atw1lme4U6XsGyOikA-aERn9ECpEU0FISzlhZSgWsYs9052GHs4upCuUtAxrAIv2P78GGVvoR_u3r3nCeN6FpaPjqeSSlC2I_1qvUbNbaKJs6SU8ZlVpgcbtBrWrDxQobB18U8zsmyrNiH6cbI9FRTpaFGez-gADHlsP31C7QKo6E")`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="text-center mb-6">
          <h2 className="text-[#181811]  text-2xl md:text-4xl font-bold">WHY WORK AT HUSHRYD</h2>
        </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
  {benefits.map((benefit) => {
    const Icon = benefit.icon;

    return (
      <div
        key={benefit.title}
        className="flex flex-col items-start gap-2 rounded-lg border border-[#e6e6db] bg-[#f8f8f5] p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-center size-12 rounded-full bg-orange-500">
          <Icon sx={{ fontSize: 24, color: 'white' }} />
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="text-[#181811] text-lg font-semibold">
            {benefit.title}
          </h3>
          <p className="text-[#5a5a40] text-sm leading-relaxed">
            {benefit.description}
          </p>
        </div>
      </div>
    );
  })}
</div>

    {/* Open Positions Section */}
    <div className="py-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#FF6B35] font-bold tracking-widest uppercase text-sm">We are hiring</span>
          <h2 className="text-[#181811] text-3xl md:text-4xl font-black mt-2">Open Positions</h2>
          <p className="text-[#5a5a40] mt-4 text-lg max-w-2xl mx-auto">
            Ready to make a difference? Pick the role that fits your passion and apply today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Support */}
          <div className="flex flex-col p-8 rounded-2xl border border-[#e6e6db] hover:shadow-lg transition-shadow bg-white">
              <h3 className="text-xl font-bold text-[#181811] mb-3">
                Customer Support Specialist
              </h3>

              <p className="text-[#5a5a40] mb-6 leading-relaxed flex-grow text-lg">
                Be the voice of care at HushRyd. You are the first line of trust for our users,
                ensuring every query is resolved with empathy and speed.
              </p>

              <div className="flex flex-col md:flex-row items-center gap-4 mt-auto">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeCnW-TZYv9AXpN1KlvcOl-snoVMM0GfmOZobrjPFfbptPp1A/viewform?usp=publish-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full h-12 px-8 bg-[#FF6B35] text-white font-bold shadow-md hover:-translate-y-0.5 hover:shadow-xl transition-all no-underline"
                >
                  Apply Now
                </a>

                <span className="text-sm font-medium text-[#5a5a40] bg-[#f0f0eb] px-3 py-1 rounded-full">
                  Full-time
                </span>
              </div>
           </div>


          {/* Legal Consultant */}
          <div className="flex flex-col p-8 rounded-2xl border border-[#e6e6db] hover:shadow-lg transition-shadow bg-white">
            <h3 className="text-xl font-bold text-[#181811] mb-3">Legal Consultant</h3>
            <p className="text-[#5a5a40] mb-6 leading-relaxed flex-grow text-lg">
              Navigate the regulatory landscape of ride-sharing. Propel our growth by ensuring compliance and building a framework of trust.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4 mt-auto">
               <a
                // href="https://forms.zoho.com/your-org/form/JobApplication?position=Legal%20Consultant"
                href="https://docs.google.com/forms/d/e/1FAIpQLSeulurPPfJJCUbyb7rjVLWjrdmkbW2byknO_mrVnUZHrzoV6A/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full h-12 px-8 bg-[#FF6B35] text-white font-bold shadow-md hover:translate-y-[-2px] hover:shadow-xl transition-all w-fit no-underline"
              >
                Apply Now
              </a>
               <span className="text-sm font-medium text-[#5a5a40] bg-[#f0f0eb] px-3 py-1 rounded-full">Full-time</span>
            </div>
          </div>
          <div className="flex flex-col p-8 rounded-2xl border border-[#e6e6db] hover:shadow-lg transition-shadow bg-white">
            <h3 className="text-xl font-bold text-[#181811] mb-3">Marketing Executive</h3>
            <p className="text-[#5a5a40] mb-6 leading-relaxed flex-grow text-lg">
              Drive brand growth by shaping compelling go-to-market strategies. Build awareness, trust, and customer loyalty through data-driven campaigns and clear value messaging.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4 mt-auto">
               <a
               href="https://docs.google.com/forms/d/e/1FAIpQLScfrgR-VmUVE5UD4cln72XtTX-LehTVc9daACnpDXTz-FBPrA/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full h-12 px-8 bg-[#FF6B35] text-white font-bold shadow-md hover:translate-y-[-2px] hover:shadow-xl transition-all w-fit no-underline"
              >
                Apply Now
              </a>
               <span className="text-sm font-medium text-[#5a5a40] bg-[#f0f0eb] px-3 py-1 rounded-full">Full-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>

     {/* <div className="px-6 lg:px-20 xl:px-40 py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto relative">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-[#181811]  text-3xl md:text-4xl font-extrabold tracking-tight">
            Life at the Office
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="h-80 bg-center bg-cover rounded-xl shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
              style={{ backgroundImage: `url("${image}")` }}
            ></div>
          ))}
        </div>
      </div>
    </div> */}
    <div className="px-6 lg:px-20 xl:px-40 py-20 ">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[#181811]  text-2xl md:text-4xl font-bold">Built by People Who’ve Lived the Problem</h2>
        </div>
       <Box>
  <Box className="relative w-full max-w-6xl mx-auto">
  {/* Carousel Grid */}
  <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    {visibleTestimonials.map((testimonial, index) => (
      <Box
        key={index}
        className="bg-white px-10 py-3 rounded-xl shadow-xl border border-yellow-400/20 flex flex-col gap-2 relative"
      >
        {/* Quote Icon */}
        <FormatQuoteIcon
          sx={{
            color: '#f2f20d',
            fontSize: 64,
            position: 'absolute',
            top: -10,
            left: -10,
            opacity: 0.4,
          }}
        />

        {/* Quote Text */}
        <p className="text-[#181811] text-xl italic leading-relaxed">
          {testimonial.quote}
        </p>

        {/* Author Info */}
        <Box className="flex items-center gap-4 mt-auto">
          <Box
            className="w-14 h-14 rounded-full bg-contain bg-center"
            sx={{
              backgroundImage: `url(${testimonial.image})`,
            }}
          />
          <Box className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
            <h4 className="text-[#181811] font-bold">{testimonial.author}</h4>
            <p className="text-[#5a5a40]">{testimonial.role}</p>
          </Box>
        </Box>
      </Box>
    ))}
  </Box>

  {/* Arrows */}
  <button
    onClick={() => setActiveStep((s) => s - 1)}
    disabled={activeStep === 0}
    className="absolute top-1/2 left-[-40px] -translate-y-1/2 p-3 bg-white rounded-full shadow  cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-0 "
    aria-label="Previous testimonial"
  >
    <ChevronLeftIcon fontSize="large"  />
  </button>

  <button
    onClick={() => setActiveStep((s) => s + 1)}
    disabled={activeStep === maxSteps - 1}
    className="absolute top-1/2 right-[-30px] -translate-y-1/2 p-3 bg-transparent rounded-full shadow cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-0"
    aria-label="Next testimonial"
  >
    <ChevronRightIcon fontSize="large"  />
  </button>
</Box>

</Box>

      </div>
    </div>
    </PublicLayout>
  );
}
