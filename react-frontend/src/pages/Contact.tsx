import PublicLayout from "../components/layouts/PublicLayout"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function Contact() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-white from-orange-100 via-white to-orange-50 py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600">
              We're here to help with bookings, payments, safety, and support.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Email */}
            <div className="border border-gray-200 rounded-xl p-8 hover:shadow-lg transition bg-white">
              <div className="h-14 w-14 rounded-full bg-orange-500 flex items-center justify-center mb-4">
                <Mail className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Email Us
              </h3>
              <p className="text-gray-600 mb-3">
                Our friendly team is here to help.
              </p>
              <a
                href="mailto:support@hushryd.com"
                className="text-orange-600 font-semibold hover:underline break-all"
              >
                support@hushryd.com
              </a>
            </div>

            {/* Phone */}
            <div className="border border-gray-200 rounded-xl p-8 hover:shadow-lg transition bg-white">
              <div className="h-14 w-14 rounded-full bg-green-600 flex items-center justify-center mb-4">
                <Clock className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                24/7 Support
              </h3>
              <p className="text-gray-600 mb-3">
                Emergency helpline available round the clock.
              </p>
              <a
                href="tel:+917780445190"
                className="text-orange-600 font-semibold hover:underline"
              >
                +91 7780445190
              </a>
            </div>

            {/* Address */}
            <div className="border border-gray-200 rounded-xl p-8 hover:shadow-lg transition bg-white">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                <MapPin className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Visit Us
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Manjeera Trinity Corporate<br />
                eSeva Ln, K P H B Phase 3,<br />
                Kukatpally, Hyderabad,<br />
                Telangana 500072
              </p>
            </div>
          </div>

          {/* Emergency */}
          <div className="max-w-3xl mx-auto mt-16 text-center px-4">
            <div className="bg-orange-100 border border-orange-200 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Need Immediate Assistance?
              </h3>

              <p className="text-gray-700 mb-6">
                For urgent matters or emergencies during your ride, please use
                the SOS button in the app or call our 24/7 helpline immediately.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="tel:+917780445190"
                  className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call +91 7780445190
                </a>

                <a
                  href="mailto:support@hushryd.com"
                  className="inline-flex items-center gap-2 border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
