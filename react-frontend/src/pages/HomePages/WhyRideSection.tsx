import { IndianRupee, Users, Zap } from "lucide-react";

const features = [
  {
    icon: IndianRupee,
    title: "Unbeatable Prices",
    description:
      "Travel for a fraction of the cost of trains or buses. Driver-shared costs mean value for all.",
  },
  {
    icon: Users,
    title: "Verified Community",
    description:
      "Every member provides Government ID. We verify addresses and things so you know exactly who you're traveling with.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description:
      "No more waiting lists. Find a ride, book your seat instantly, and get immediate confirmation via SMS and app.",
  },
];

export function WhyRideSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl mb-4">
            Why ride with HushRyd?
          </h2>
          <p className="text-lg text-gray-600">
            We are redefining intercity travel by prioritizing safety, transparency, and community for everyone.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all hover:border-orange-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <feature.icon className="h-7 w-7" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
