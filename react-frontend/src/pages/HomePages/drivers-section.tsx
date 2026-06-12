import images from "../../assets/images";

export function DriversSection() {
  return (
    <section className="py-14 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          {/* Image */}
          <div className="relative flex justify-center">
            <div className="rounded-2xl overflow-hidden max-w-md">
              <img
                src={images.HeroDriver}
                alt="Driver earning with HushRyd"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="lg:pl-6">
            <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">
              For Drivers
            </span>

            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl mb-4">
              Empty seats are expensive seats.
            </h2>

            <p className="text-base text-gray-300 mb-6 max-w-lg">
              Cover your fuel costs by sharing your ride. Post in minutes, choose
              your passengers, and get paid directly to your bank account.
            </p>

            <ul className="space-y-3 mb-6">
              {[
                "Post a ride in under 2 minutes",
                "Choose who rides with you",
                "Instant bank transfers when ride starts",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="/post-ride"
              className="inline-block px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition"
            >
              Post a Ride Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
