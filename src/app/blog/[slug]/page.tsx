import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { PostCard, PostMeta } from "@/components/blog/PostCard";
import { DocBody } from "@/components/docs/DocBody";
import { docsSource, posts, renderContent } from "@/lib/docs";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => posts.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((row) => row.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Post not found" };
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((row) => row.slug === slug);
  if (!post) notFound();
  const { html } = renderContent("blog", slug);
  const wide = html.includes("<table");
  const others = posts.filter((row) => row.slug !== slug).slice(0, 3);
  return (
    <div className="q-page">
      <div className={`article ${wide ? "article-wide" : ""}`} style={{ padding: 0, marginBottom: 0 }}>
        <Link className="back-link" href="/blog/">
          &lt; All posts
        </Link>
      </div>
      <article className={`q-card article ${wide ? "article-wide" : ""}`}>
        <header className="article-head">
          <PostMeta post={post} />
          <h1>{post.title}</h1>
          <p className="post-meta">By the Qognition authors</p>
        </header>
        {post.note && <p className="q-sub article-note">{post.note}</p>}
        <DocBody html={html} />
        <p className="article-foot">
          From{" "}
          <a href={`${docsSource.sourceRepository}/blob/${docsSource.sourceCommit}/${post.source}`} target="_blank" rel="noreferrer">
            <code>{post.source}</code>
          </a>{" "}
          in the simulator repository. All results are model output, not predictions.
        </p>
      </article>
      <section className="more-posts" aria-labelledby="more-posts">
        <div className="section-head">
          <h2 id="more-posts">More from the blog</h2>
        </div>
        <div className="post-grid">
          {others.map((row) => (
            <PostCard post={row} key={row.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
