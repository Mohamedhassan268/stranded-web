import Link from "next/link";
import { formatDate } from "@/lib/docs";

type Post = { slug: string; title: string; date: string; minutes: number; category: string; excerpt: string; cover: string | null };

export function PostMeta({ post }: { post: Post }) {
  return (
    <p className="post-meta">
      <span className="q-badge" style={{ "--tone": post.category === "Results" ? "var(--gold)" : "var(--green-dark)" } as React.CSSProperties}>
        {post.category}
      </span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span>· {post.minutes} min read</span>
    </p>
  );
}

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link className="q-card post-featured" href={`/blog/${post.slug}/`}>
      <div>
        <PostMeta post={post} />
        <h2>{post.title}</h2>
      </div>
      <div>
        <p>{post.excerpt}</p>
        <span className="media-more">Read the post</span>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link className="q-card media-card" href={`/blog/${post.slug}/`}>
      {post.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt="" loading="lazy" />
      ) : (
        <div className="media-cover" aria-hidden="true">
          {post.category}
        </div>
      )}
      <div className="media-card-body">
        <PostMeta post={post} />
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <span className="media-more">Read the post</span>
      </div>
    </Link>
  );
}
