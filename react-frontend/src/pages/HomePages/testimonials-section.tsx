import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Passenger",
    rating: 5,
    trips: "12 rides",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    content:
      "I travel between Bangalore and Mysore every weekend. HushRyd has made it so affordable and safe. The SOS feature gives me peace of mind.",
  },
  {
    name: "Rahul Mehta",
    role: "Captain",
    rating: 5,
    trips: "56 rides",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    content:
      "Finding rides is super simple. I've met interesting people and covered my petrol costs entirely for my last 3 trips to Goa. The live tracking works flawlessly.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl mb-4">
            Loved by thousands
          </h2>
          <p className="text-lg text-gray-600">
            See what our community has to say about their HushRyd experience.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl border border-gray-200 bg-white p-8"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-800 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-300 text-gray-700 font-semibold">
                      {testimonial.name[0]}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role} • {testimonial.trips}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
