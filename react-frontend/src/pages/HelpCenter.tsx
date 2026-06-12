import { Link } from "react-router-dom"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
} from "@mui/material"
import {
  Search,
  Book,
  Group,
  Shield,
  CreditCard,
  Phone,
  Email,
  Chat,
} from "@mui/icons-material"
import PublicLayout from "../components/layouts/PublicLayout"

export default function HelpCenter() {
  return (
    <PublicLayout>
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background:
            "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(0,0,0,0))",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            How can we help you?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Search our knowledge base or browse categories below
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for help..."
              size="medium"
            />
            <Button variant="contained">
              <Search />
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Categories */}
      <Container sx={{ py: 8 }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          <HelpCard
            icon={<Book />}
            title="FAQs"
            text="Find answers to commonly asked questions"
            link="/faq"
          />
          <HelpCard
            icon={<Group />}
            title="How It Works"
            text="Learn how to book and publish rides"
            link="/how-it-works"
          />
          <HelpCard
            icon={<Shield />}
            title="Safety & Security"
            text="Learn about our safety features"
            link="/safety"
          />
          <HelpCard
            icon={<CreditCard />}
            title="Cancellation Policy"
            text="Understand our cancellation rules"
            link="/cancellation"
          />
          <HelpCard
            icon={<Group />}
            title="Post A Ride"
            text="Turn Your Empty Seats Into Extra Income"
            link="/post-ride"
          />
          <HelpCard
            icon={<Chat />}
            title="Contact Support"
            text="Get in touch with our team"
            link="/contact"
          />
        </Box>
      </Container>

      {/* Contact Section */}
      <Box sx={{ backgroundColor: "#f5f5f5", py: 8 }}>
        <Container maxWidth="sm">
          <Typography variant="h4" textAlign="center" fontWeight={700}>
            Still need help?
          </Typography>
          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Our support team is here for you 24/7
          </Typography>

          <Box sx={{ display: "grid", gap: 3 }}>
            <ContactCard
              icon={<Phone />}
              title="Call Us"
              value="+91 7780445190"
              link="tel:+917780445190"
            />
            <ContactCard
              icon={<Email />}
              title="Email Us"
              value="support@hushryd.com"
              link="mailto:support@hushryd.com"
            />
          </Box>
        </Container>
      </Box>
    </Box>
    </PublicLayout>
  )
}


/* Reusable Components */

function HelpCard({ icon, title, text, link }) {
  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      <Card
        sx={{
          height: "100%",
          transition: "0.3s",
          "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Box sx={{ color: "#FF6B35", mb: 2 }}>{icon}</Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography color="text.secondary">{text}</Typography>
        </CardContent>
      </Card>
    </Link>
  )
}

function ContactCard({ icon, title, value, link }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Box sx={{ color: "#FF6B35", mb: 1 }}>{icon}</Box>
        <Typography fontWeight={600}>{title}</Typography>
        <Typography
          component="a"
          href={link}
          sx={{ color: "#FF6B35", textDecoration: "none" }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}