import Link from "next/link";
import { Glossary } from "@/components/Glossary";
import { GLOSSARY } from "@/lib/glossary";

export const metadata = { title: "Từ điển GTM · GA4 · Google Ads" };

export default function GlossaryPage() {
  const count = GLOSSARY.reduce((n, s) => n + s.entries.length, 0);
  return (
    <article className="prose-lab mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Từ điển GTM · GA4 · Google Ads</h1>
      <p className="mt-3 text-muted">
        {count} menu, trường và thuật ngữ bạn sẽ gặp trong khoá học, kèm ý nghĩa bằng tiếng Việt. Tên menu/trường giữ nguyên tiếng
        Anh như trên giao diện để bạn dễ tìm. Đang làm bài nào thì mở song song với{" "}
        <Link href="/lab/guide" className="text-accent underline">
          Bài học
        </Link>
        .
      </p>

      <nav className="card my-6 p-4">
        <p className="mb-2 text-sm font-semibold">Mục lục</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {GLOSSARY.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-accent hover:underline">
                {s.title}
              </a>{" "}
              <span className="text-muted">({s.entries.length})</span>
            </li>
          ))}
        </ol>
      </nav>

      <Glossary sections={GLOSSARY} />
    </article>
  );
}
