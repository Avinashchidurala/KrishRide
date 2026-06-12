import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PublicLayout from "../components/layouts/PublicLayout";
import { useLocation } from 'react-router-dom';


const sections = [
  {
    title: "General FAQ'S",
    questions: [
      {
        question: "Can I book multiple seats?",
        answer: "Yes, if available — depending on vehicle capacity.",
      },
      {
        question: "What happens if the driver doesn’t accept my request?",
        answer: "You are free to book another ride — no charges applied.",
      },
      {
        question: "How long do I have to report a complaint?",
        answer: "Within 24–48 hours for quick investigation.",
      },
    ],
  },
  {
    title: "Driver-Specific FAQs",
    questions: [
      {
        question: "Can I drive rented cars?",
        answer: "Only if you are legally permitted and documents are valid.",
      },
      {
        question: "Will I earn money from rides?",
        answer: (
          <>
            Drivers receive a <strong>fuel cost contribution</strong>, not profit.
            HushRyd promotes responsible cost-sharing.
          </>
        ),
      },
      {
        question: "What if a passenger behaves badly?",
        answer:
          "You can deny the trip, report, and request account blocking.",
      },
      {
        question: "How many rides can I post?",
        answer:
          "As per your personal travel — no commercial driving is allowed.",
      },
    ],
  },
  {
    title: "🚗 HUSHRYD — Terms & Conditions",
    questions: [
      {
        question: "Platform Nature",
        answer: (
          <>
            HushRyd is a <b>carpooling platform</b> that connects passengers and
            drivers. We <b>do not</b> provide transportation services and are{" "}
            <b>not liable</b> for road incidents, delays, or user behavior.
          </>
        ),
      },
      {
        question: "Payments & Cancellations",
        answer:
          "Ride fares and cancellation fees may change. Refunds are issued as per our cancellation rules.",
      },
      {
        question: "Eligibility & KYC",
        answer: (
          <>
            Users must be <b>18+</b> and complete <b>KYC verification</b> to book
            or offer rides.
          </>
        ),
      },
      {
        question: "User Conduct",
        answer: (
          <>
            Respectful behavior is mandatory. Harassment, illegal items, or unsafe
            activities will lead to account <b>suspension</b>.
          </>
        ),
      },
      {
        question: "Safety Features",
        answer: (
          <>
            SOS and safety tools are <b>support features only</b> and should be
            used responsibly.
          </>
        ),
      },
      {
        question: "Account Action",
        answer:
          "HushRyd may suspend or remove accounts violating policies or posing safety risks.",
      },
      {
        question: "Updates",
        answer:
          "We may update these terms anytime. Continued use means acceptance of changes.",
      },
    ],
  },
  {
    title: "🔒 HUSHRYD — Privacy Policy",
    questions: [
      {
        question: "Data We Collect",
        answer: (
          <>
            Basic profile info (name, phone, email), KYC details, ride history, and{" "}
            <b>location only during active rides.</b>
          </>
        ),
      },
      {
        question: "How We Use Data",
        answer:
          "To enable ride matching, communication, safety features, fraud prevention, and app improvements.",
      },
      {
        question: "Data Sharing",
        answer: (
          <>
            We <b>do not sell data.</b> Sharing happens only when required for
            safety, trip coordination, or legal compliance.
          </>
        ),
      },
      {
        question: "Data Protection",
        answer:
          "Encrypted storage, masked contact details, and active safety monitoring.",
      },
      {
        
          question: "User Rights",
          answer:
            "You may update or request deletion of your data (subject to legal requirements).",
        
      },
      {
        question: "Policy Changes",
        answer:
          "Updates may occur anytime. Continued use means acceptance of the latest version.",
      },
    ],
  },
];

export default function FAQ() {
  const location = useLocation();
  const isCustomerRoute = location.pathname.startsWith('/customer');

  const content = (
    
      <Box sx={{ py: { xs: 4, md: 6 }, maxWidth: "900px", mx: "auto" }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          Frequently Asked Questions
        </Typography>

        {sections.map((section, index) => (
          <Box
            key={index}
            sx={{
              mb: 6,
              p: { xs: 2.5, md: 3 },
              backgroundColor: "background.paper",
              borderRadius: 3,
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              {section.title}
            </Typography>

            {section.questions.map((item, i) => (
              <Accordion
                key={i}
                disableGutters
                elevation={0}
                sx={{
                  mb: 1.5,
                  borderBottom:'1px solid',
                  // border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    {item.question}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
))}
      </Box>
    
  );
    return isCustomerRoute ? content : <PublicLayout>{content}</PublicLayout>;
}
