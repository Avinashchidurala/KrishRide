import React from "react";
import { Box, Typography, Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import StarIcon from "@mui/icons-material/Star";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layouts/PublicLayout";

/* ---------------- TYPES ---------------- */

type Step = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

/* ---------------- DATA ---------------- */

const passengerSteps: Step[] = [
  {
    icon: <SearchIcon />,
    title: "Search for a ride",
    description:
      "Enter pickup, destination, and travel date. Browse rides from verified drivers.",
  },
  {
    icon: <CreditCardIcon />,
    title: "Book & Pay",
    description:
      "Choose your ride, select seats, and complete secure payment.",
  },
  {
    icon: <DirectionsCarIcon />,
    title: "Travel safely",
    description:
      "Meet your driver, share live tracking, and enjoy your journey.",
  },
  {
    icon: <StarIcon />,
    title: "Rate your experience",
    description:
      "Rate your driver after the ride to keep the community trusted.",
  },
];

const driverSteps: Step[] = [
  {
    icon: <CreditCardIcon />,
    title: "Complete verification",
    description: "Submit license, RC, and insurance for quick approval.",
  },
  {
    icon: <DirectionsCarIcon />,
    title: "Publish your ride",
    description: "Add route details, set price per seat, and publish.",
  },
  {
    icon: <SearchIcon />,
    title: "Accept bookings",
    description: "Review passenger requests and accept bookings.",
  },
  {
    icon: <StarIcon />,
    title: "Build your reputation",
    description:
      "Earn ratings and get more bookings as a trusted driver.",
  },
];

/* ---------------- PAGE ---------------- */

export default function HowItWorks() {
  return (
    <PublicLayout>
      {/* HERO */}
      <Box
        sx={{
          py: 10,
          textAlign: "center",
          background: "linear-gradient(135deg, #FFF3EC, #FFFFFF)",
        }}
      >
        <Typography variant="h3" fontWeight="bold" mb={2}>
          How HushRyd Works
        </Typography>
        <Typography color="text.secondary" maxWidth={700} mx="auto">
          Whether you're looking for a ride or offering one, we’ve made it simple
          and secure.
        </Typography>
      </Box>

      {/* PASSENGERS */}
      <HorizontalSection
        title="For Passengers"
        subtitle="Find and book rides in 4 easy steps"
        steps={passengerSteps}
        ctaText="Find a Ride"
        ctaLink="/find-ride"
      />

      {/* DRIVERS */}
      <HorizontalSection
        title="For Drivers"
        subtitle="Start earning from your empty seats"
        steps={driverSteps}
        ctaText="Post a Ride"
        ctaLink="/post-ride"
        muted
      />
    </PublicLayout>
  );
}

/* ---------------- SECTION ---------------- */

type SectionProps = {
  title: string;
  subtitle: string;
  steps: Step[];
  ctaText: string;
  ctaLink: string;
  muted?: boolean;
};

function HorizontalSection({
  title,
  subtitle,
  steps,
  ctaText,
  ctaLink,
  muted = false,
}: SectionProps) {
  return (
    <Box sx={{ py: 10, backgroundColor: muted ? "#FAFAFA" : "transparent" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        {/* Title */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" fontWeight="bold" mb={1}>
            {title}
          </Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </Box>

        {/* Steps */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: `repeat(${steps.length}, 1fr)`,
            },
            gap: 6,
            position: "relative",
          }}
        >
          {/* Horizontal line (desktop only) */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 26,
              left: "5%",
              right: "5%",
              height: "2px",
              backgroundColor: "#e0e0e0",
              zIndex: 0,
            }}
          />

          {steps.map((step, index) => (
            <HorizontalStep key={index} step={step} index={index} />
          ))}
        </Box>

        {/* CTA */}
        <Box textAlign="center" mt={7}>
          <Button
            component={Link}
            to={ctaLink}
            size="large"
            sx={{
              backgroundColor: "#FF6B35",
              color: "#fff",
              px: 5,
              py: 1.5,
              "&:hover": { backgroundColor: "#e85a28" },
            }}
          >
            {ctaText}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/* ---------------- STEP ---------------- */

function HorizontalStep({
  step,
  index,
}: {
  step: Step;
  index: number;
}) {
  return (
    <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
      {/* Number */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: "#FF6B35",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          mx: "auto",
          mb: 2,
        }}
      >
        {index + 1}
      </Box>

      {/* Icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#FFF3EC",
          color: "#FF6B35",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          fontSize: 28,
        }}
      >
        {step.icon}
      </Box>

      {/* Text */}
      <Typography fontWeight="bold" mb={0.5}>
        {step.title}
      </Typography>
      <Typography color="text.secondary" fontSize={14}>
        {step.description}
      </Typography>
    </Box>
  );
}