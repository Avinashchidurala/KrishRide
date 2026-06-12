import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  Container,
} from "@mui/material";

import ShieldIcon from "@mui/icons-material/Shield";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../components/layouts/PublicLayout";
import images from "../assets/images";
import { Shield, Heart, Users } from "lucide-react"

export default function About() {
  const navigate = useNavigate()
  const handleNavigate = () => {
    navigate('/find-ride')
  }
  const team = [
    {
      name: "Soubhagya",
      role: "CEO & Co-Founder",
      description:
        "Leads business direction, partnerships, and safety-first operations. With strong expertise in Operations, Customer Support & Business Development, he focuses on scaling responsibly while earning user trust.",
      tags: ["Operations", "Business Dev", "Customer Support"],
      image: images.Ceo
    },
    {
      name: "Tarun",
      role: "Co-Founder",
      description:
        "Heads marketplace operations, customer support excellence, and sales performance. Ensures riders and car owners experience a smooth, secure, high-quality journey every time.",
      tags: ["Marketplace", "Sales", "Support"],
      image: images.CoFounder
    },
  ];
  return (
    <PublicLayout>
      {/* ================= HERO ================= */}
      <Box
        sx={{
          py: { xs: 12, md: 14 },
          textAlign: "center",
          background: "#fff",
        }}
      >
        <Container maxWidth="md">
          <Chip
            icon={<FavoriteIcon />}
            label="Our Journey"
            sx={{
              mb: 3,
              px: 2,
              bgcolor: "#FFE4D6",
              color: "primary.main",
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: "primary.main",
              },
            }}
          />

          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{ fontSize: { xs: "2.6rem", md: "3.8rem" } }}
            mb={3}
          >
            About Us — The Story Behind{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              HushRyd
            </Box>
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" } }}
          >
            Building a circle of trust on every ride — transforming long distance
            travel from <b>“I hope I reach safe”</b> to{" "}
            <b style={{ color: "primary.main" }}>“I know I will.”</b>
          </Typography>

          {/* Trust badges */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 6 }}
          >
            <Chip
              icon={<SecurityIcon sx={{ color: "#2E7D32" }} />}
              label="Safe Routes"
              sx={{
                bgcolor: "sucsess.light",
                color: "success.main",
                fontWeight: 600,
                px: 2,
                border: "1px solid #C8E6C9",
                '& .MuiChip-icon': {
                  color: "success.main",
                },
              }}
            />
            <Chip
              icon={<FavoriteIcon sx={{ color: "#D81B60" }} />}
              label="Women's Safety"
              sx={{
                bgcolor: "#FCE4EC",
                color: "#D81B60",
                fontWeight: 600,
                px: 2,
                border: "1px solid #F8BBD0",
                '& .MuiChip-icon': {
                  color: "#D81B60",
                },
              }}
            />
            <Chip
              icon={<VerifiedIcon sx={{ color: "#1565C0" }} />}
              label="Verified Drivers"
              sx={{
                bgcolor: "#E3F2FD",
                color: "#1565C0",
                fontWeight: 600,
                px: 2,
                border: "1px solid #BBDEFB",
                '& .MuiChip-icon': {
                  color: '#1565C0', // icon
                },
              }}
            />
          </Stack>
        </Container>
      </Box>

      {/* ================= HERO IMAGE ================= */}
      <Container maxWidth="lg" sx={{ mt: -10 }}>
        <Box
          sx={{
            height: { xs: 300, md: 420 },
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            boxShadow: 6,
          }}
        >
          <Box
            component="img"
            src={images.AboutHero}
            alt="Safe carpool"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,.65), transparent)",
              display: "flex",
              alignItems: "flex-end",
              p: 4,
            }}
          >
            <Typography variant="h4" color="white" fontWeight="bold">
              Every journey should feel safe, not scary
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* ================= OUR STORY ================= */}
      <Box sx={{ py: { xs: 12, md: 14 } }}>
        <Container maxWidth="lg">
          {/* Heading */}
          <Box textAlign="center" mb={10}>
            <Typography variant="h1" fontWeight={700} fontSize={{ xs: '2.5rem', md: '3.5rem' }}>
              Our Story
            </Typography>
            <Typography color="#FF6B35" fontWeight={600} sx={{ mb: 4 }} variant="h5">
              Where It All Began
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'row' }, // always side by side
              alignItems: 'flex-start',
              gap: 6, // space between left and right
              flexWrap: 'wrap', // allows wrapping if screen is too small
            }}
          >
            {/* LEFT TEXT */}
            <Box sx={{ flex: 1, minWidth: 300, textAlign: 'left' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                HushRyd didn't begin in a boardroom. It began with a friend, a journey, and a rising fear.
              </Typography>

              <Typography variant="body1" sx={{ mb: 3 }}>
                She traveled often from Hyderabad to her hometown — weekends, holidays, family events. But every trip felt like a battle of compromises:
              </Typography>

              <Stack spacing={2} sx={{ pl: 2, borderLeft: '3px solid #FF6B35', mb: 3 }}>
                <Typography>• AC buses made her suffocate during rain and winter</Typography>
                <Typography>• The moment the bus stopped, she worried about food availability and safety</Typography>
                <Typography>• News of rising bus accidents made every long road feel more dangerous</Typography>
                <Typography>• Traveling in private cars felt even scarier — no verified drivers, no emergency features</Typography>
              </Stack>

              <Box sx={{ p: 3, borderRadius: 2, backgroundColor: '#FFF4EC', mb: 3, fontStyle: 'italic' }}>
                “Imagine traveling long distances… not with excitement, but with stress and silent prayers.”
              </Box>

              <Typography fontWeight={600} sx={{ mb: 2 }}>
                Watching her, we realized: <b>This isn't just her story — this is the reality of millions of women in India.</b>
              </Typography>

              <Typography color="#FF6B35" fontWeight={600} fontSize="20px">
                That's the moment HushRyd took shape.
              </Typography>
            </Box>

            {/* RIGHT IMAGES */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Stack spacing={3}>
                <Box
                  component="img"
                  src={images.AboutVerifiedDrivers}
                  alt="Verified Drivers"
                  sx={{ width: { xs: '100%', md: '60%' }, borderRadius: 3, boxShadow: 2, objectFit: 'cover', }}
                />
                <Box
                  component="img"
                  src={images.AboutMap}
                  alt="Safe Ride Tracking"
                  sx={{ width: { xs: '100%', md: '60%' }, height: 'auto', borderRadius: 3, boxShadow: 2, objectFit: 'cover' }}
                />

              </Stack>
            </Box>
          </Box>

        </Container>
      </Box>

      {/* ================= OUR PURPOSE ================= */}
      <Box sx={{ py: { xs: 10, md: 1 }, backgroundColor: "#FAFAFA", mx: 'auto', textAlign: 'center' }}>
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }}>

          {/* TITLE – ALWAYS ON TOP FOR MOBILE */}
          <Box
            sx={{
              mb: { xs: 6, md: 3 },
              maxWidth: 480,
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, py: 2 }}
            >
              Our Purpose
            </Typography>

            <Typography sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
              Why We Exist
            </Typography>

            <Typography sx={{ color: '#4B5563', lineHeight: 1.9 }}>
              Every feature we build answers a real fear, a real story,
              and a real woman’s voice.
            </Typography>
          </Box>

          {/* CARDS */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 4,
            }}
          >
            {[
              {
                icon: <ShieldIcon sx={{ color: "#2E7D32" }} />,
                title: "Safety Shouldn’t Depend on Luck",
                text:
                  "Because every woman deserves guaranteed protection, not hopeful prayers.",
              },
              {
                icon: <StarIcon sx={{ color: "#1565C0" }} />,
                title: "Comfort Without Compromise",
                text:
                  "Because no woman should choose between comfort and security on her journey.",
              },
              {
                icon: <FavoriteIcon sx={{ color: "#C2185B" }} />,
                title: "Peace for Families",
                text:
                  "Because parents shouldn’t wait in fear for a safe arrival message.",
              },
              {
                icon: <DirectionsCarIcon sx={{ color: "#EF6C00" }} />,
                title: "Confident Ride Sharing",
                text:
                  "Because car owners shouldn’t share rides with anxiety about who’s joining.",
              },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  p: 4,
                  backgroundColor: "#fff",
                  borderRadius: 3,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ mb: 2 }}>{item.icon}</Box>
                <Typography fontWeight={700} mb={1}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#6B7280", lineHeight: 1.7 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ================= SAFETY MOVEMENT CTA ================= */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              bgcolor: "primary.main",
              borderRadius: "22px",
              px: { xs: 3, md: 8 },
              py: { xs: 5, md: 6 },
              textAlign: "center",
              color: "primary.contrastText",
            }}
          >
            {/* TOP CHIP */}
            <Chip
              label="Join the Movement"
              sx={{
                mb: 3,
                px: 1.5,
                height: 30,
                fontSize: "0.8rem",
                bgcolor: "rgba(255,255,255,0.18)",
                color: "primary.contrastText",
                fontWeight: 600,
              }}
            />

            {/* HEADING */}
            <Typography
              sx={{
                fontSize: { xs: "1.7rem", md: "2.6rem" },
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 2.5,
              }}
            >
              We’re Not a Ridesharing App.
              <br />
              We are a Safety Movement on Wheels.
            </Typography>

            {/* SUB TEXT */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                opacity: 0.95,
                maxWidth: 640,
                mx: "auto",
                mb: 4,
              }}
            >
              Join us in creating safer journeys for every woman, every family,
              every traveler in India.
            </Typography>

            {/* BUTTONS */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="center"
              mb={5}
            >
              <Button
                onClick={handleNavigate}
                sx={{
                  bgcolor: "primary.contrastText",
                  color: "primary.main",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.2,
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  "&:hover": {
                    bgcolor: "#FFF3EC",
                  },
                }}
              >
                Start Your Safe Journey →
              </Button>

              <Button
                variant="outlined"
                sx={{
                  borderColor: "primary.contrastText",
                  color: "primary.contrastText",
                  fontWeight: 600,
                  px: 3.5,
                  py: 1.2,
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderColor: "primary.contrastText",
                  },
                }}
              >
                Learn More
              </Button>
            </Stack>

            {/* DIVIDER */}
            <Box
              sx={{
                height: 1,
                width: "100%",
                bgcolor: "rgba(255,255,255,0.25)",
                mb: 4,
              }}
            />

            {/* STATS */}
            <Grid container spacing={3} justifyContent="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography fontSize="1.6rem" fontWeight={800}>
                  50K+
                </Typography>
                <Typography sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
                  Safe Travelers
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography fontSize="1.6rem" fontWeight={800}>
                  100%
                </Typography>
                <Typography sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
                  Verified Drivers
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography fontSize="1.6rem" fontWeight={800}>
                  24/7
                </Typography>
                <Typography sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
                  SOS Support
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>


      {/* VALUES */}
      <section className="py-10 md:py-1 bg-muted/30">
        <div className="container px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">What Drives Us</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our commitment to making every journey safer, smarter, and more meaningful.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Safety First, Always</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every feature, every update, every decision is made with your safety as the top priority.
                </p>
              </div>

              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Built with Empathy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We listen to real stories, real fears, and real needs to build features that truly matter.
                </p>
              </div>

              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Community Powered</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Building a trusted network of verified drivers and safety-conscious travelers across India.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="max-w-5xl w-full space-y-8">
            <div className=" overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="flex justify-center p-6">
                  <img
                  src={team[0].image}
                  alt={team[0].name}
                    className="w-60 h-70 object-contain"
                  />
                </div>
              <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                  {team[0].name}
                  </h3>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                  {team[0].role}
                  </p>
                  <p className="text-gray-600 text-sm mt-4 leading-relaxed">
                  {team[0].description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                  {team[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            <div className="overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="p-6 md:order-1 order-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {team[1].name}
                </h3>
                <p className="text-sm font-medium text-blue-600 mt-1">
                  {team[1].role}
                </p>
                <p className="text-gray-600 text-sm mt-4 leading-relaxed">
                  {team[1].description}
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  {team[1].tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center p-6 md:order-2 order-1">
                <img
                  src={team[1].image}
                  alt={team[1].name}
                  className="w-60 h-70 object-contain"
                />
              </div>
            </div>

          </div>
        </div>

      </section>
    </PublicLayout>
  );
}