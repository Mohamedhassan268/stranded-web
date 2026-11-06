import { Star } from "@/components/Icons";
import type { Rating } from "@/lib/store";

export function RatingStars({ rating }: { rating: Rating }) {
  const average = rating.count ? rating.sum / rating.count : 0;
  const text = rating.count ? `${average.toFixed(1)} from ${rating.count} review${rating.count === 1 ? "" : "s"}` : "No reviews yet";
  return (
    <span className="stars">
      <span style={{ display: "inline-flex" }} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star key={value} filled={Math.round(average) >= value} size={17} />
        ))}
      </span>
      {text}
    </span>
  );
}
