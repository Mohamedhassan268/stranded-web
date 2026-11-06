import type { Metadata } from "next";
import { FeaturedPost, PostCard } from "@/components/blog/PostCard";
import { posts } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Blog",
  description: "Results, explainers and honest negative findings from the Qognition quantum cognition project.",
};

export default function Blog() {
  const [featured, ...rest] = posts;
  return (
    <div className="q-page">
      <header className="page-heading">
        <p className="q-kicker">Blog</p>
        <h1>What we found, and how it works</h1>
        <p>Results from the project, including the ones that go against it, and short explainers on the ideas behind the model.</p>
      </header>
      <FeaturedPost post={featured} />
      <div className="post-grid">
        {rest.map((post) => (
          <PostCard post={post} key={post.slug} />
        ))}
      </div>
    </div>
  );
}
