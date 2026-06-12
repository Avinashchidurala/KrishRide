import images from "../../assets/images";
import { MapPin, Phone } from "lucide-react";

export function SafetySection() {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-sm font-medium text-orange-500 uppercase tracking-wider">
            Safety First
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl mb-4">
            Your safety is our priority
          </h2>

          <p className="text-lg text-gray-600">
            We've built state-of-the-art safety features to ensure peace of mind
            on every kilometer of your journey.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-500" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Ride Tracking
                </h3>
                <p className="text-gray-600 mb-3">
                  Share your live location with friends and family. They can
                  track your journey from start to finish on a map, even if they
                  don't have the app.
                </p>
                <p className="text-sm text-orange-500 font-medium">
                  Live GPS updates every 5 seconds
                </p>
                <p className="text-sm text-gray-500">
                  Shareable trip link via WhatsApp/SMS
                </p>
              </div>
            </div>

              <div className="rounded-xl overflow-hidden shadow-md max-w-md mx-auto">
              <img
                src={images.HeroSOS1}
                alt="Real-time tracking feature"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
         <div className="rounded-xl overflow-hidden shadow-md max-w-sm md:max-w-md lg:max-w-lg mx-auto"> 
              <img
                src={images.HeroSOS2}
                alt="SOS Support feature"
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-red-500" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  24/7 SOS Support
                </h3>
                <p className="text-gray-600 mb-3">
                  In the unlikely event of an emergency, help is just one tap
                  away. Our dedicated safety response team is available around
                  the clock to assist you.
                </p>

                <a
                  href="/safety"
                  className="text-sm text-orange-500 font-medium hover:underline"
                >
                  Learn more about Safety
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
