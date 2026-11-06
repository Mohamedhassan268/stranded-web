"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Star } from "@/components/Icons";
import type { Review } from "@/lib/store";

const words = ["", "Didn't work", "Poor", "Fine", "Good", "Excellent"];

export function Reviews({ simId, initial, canPost }: { simId: string; initial: Review[]; canPost: boolean }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) return setError("Choose from one to five stars.");
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/sims/${simId}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), text: data.get("text"), website: data.get("website"), rating }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      form.reset();
      setRating(0);
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That review couldn't be posted.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {canPost ? (
        <form className="review-form" onSubmit={submit} style={{ marginTop: 12 }}>
          <fieldset className="star-input" onMouseLeave={() => setHover(0)}>
            <legend>{words[hover || rating] || "Ran it? How did it go?"}</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} onMouseEnter={() => setHover(value)}>
                <input type="radio" name="rating" aria-label={`${value} star${value === 1 ? "" : "s"}`} checked={rating === value} onChange={() => setRating(value)} />
                <Star filled={(hover || rating) >= value} size={28} />
              </label>
            ))}
          </fieldset>
          <label className="q-field">
            Your name (optional)
            <input className="q-input" name="name" maxLength={40} autoComplete="off" />
          </label>
          <label className="q-field">
            Your review
            <textarea className="q-textarea" name="text" required minLength={3} maxLength={1000} placeholder="What happened when you ran it? Which seed?" />
          </label>
          <label className="hp-field" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          {error && (
            <p className="q-error" role="alert">
              {error}
            </p>
          )}
          <button className="q-btn q-btn--vivid q-btn--green" disabled={saving}>
            <span>{saving ? "Posting..." : "Post review"}</span>
          </button>
          <p className="q-notice">Reviews are public as soon as they're posted. Please leave out anything private.</p>
        </form>
      ) : (
        <p className="q-notice" style={{ marginTop: 10 }}>
          Reviews aren't open yet: this site has no database connected.
        </p>
      )}
      {initial.length > 0 && (
        <ul className="review-list">
          {initial.map((review) => (
            <li key={review.id}>
              <div className="review-head">
                <b>{review.name}</b>
                <span style={{ display: "inline-flex" }} role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} filled={review.rating >= value} size={15} />
                  ))}
                </span>
              </div>
              <p>{review.text}</p>
              <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
