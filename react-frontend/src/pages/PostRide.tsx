import React from "react";
import PublicLayout from "../components/layouts/PublicLayout";
import { IndianRupee, Calendar, Shield, TrendingUp } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";

export default function PostRide() {
  const theme = useTheme();

  const features = [
    {
      icon: <IndianRupee size={28} color={theme.palette.primary.contrastText} />,
      title: "Cover Your Costs",
      text: "Offset fuel, tolls, and maintenance by sharing your ride. Captains typically save 50–70% on expenses.",
    },
    {
      icon: <Calendar size={28} color={theme.palette.primary.contrastText} />,
      title: "You're In Control",
      text: "Set your own schedule, routes, and prices. Accept only passengers you're comfortable with.",
    },
    {
      icon: <Shield size={28} color={theme.palette.primary.contrastText} />,
      title: "Verified Passengers",
      text: "All passengers provide government ID and phone verification. View ratings before accepting.",
    },
    {
      icon: <TrendingUp size={28} color={theme.palette.primary.contrastText} />,
      title: "Build Your Reputation",
      text: "Earn 5-star ratings and become a preferred captain with priority bookings.",
    },
  ];

  return (
    <PublicLayout>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <main style={{ flex: 1 }}>
          {/* Hero Section */}
          <Box py={10} textAlign="center">
            <Container maxWidth="md">
              <Typography variant="h2" component="h1" gutterBottom>
                Turn Your <Box component="span" color="primary.main">Empty Seats</Box> Into Extra Income
              </Typography>
              <Typography variant="h6" color="textSecondary" mb={4}>
                Already driving between cities? Share your ride and earn up to ₹10,000 per month covering fuel costs.
              </Typography>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/login"
              >
                Start Earning Today
              </Button>
            </Container>
          </Box>

          {/* Features Section */}
          <Box py={8}>
            <Container maxWidth="lg">
              <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>
                Why Drive with HushRyd?
              </Typography>

              {/* Cards container */}
              <Box
                display="flex"
                flexWrap="wrap"
                justifyContent="center"
                gap={4}
              >
                {features.map((item) => (
                  <Card
                    key={item.title}
                    sx={{
                      flex: "1 1 1", // responsive: grows, min-width 300px
                      maxWidth: 400,
                      borderRadius: 3,
                      textAlign: "center",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: "primary.light",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mb: 2,
                          mx: "auto",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="medium" mb={1}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.text}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Container>
          </Box>

          {/* CTA Section */}
          <Box py={10} textAlign="center">
            <Container maxWidth="sm">
              <Typography variant="h4" fontWeight="bold" mb={2}>
                Ready to Start?
              </Typography>
              <Typography variant="body1" color="textSecondary" mb={4}>
                Complete verification and publish your first ride in under 10 minutes.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={RouterLink}
                to="/login?intent=captain&redirect=/publish-ride"
              >
                Become a Captain
              </Button>
            </Container>
          </Box>
        </main>
      </Box>
    </PublicLayout>
  );
}
