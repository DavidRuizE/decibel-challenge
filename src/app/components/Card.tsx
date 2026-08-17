export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-line bg-surface p-5">
      {title && <h2 className="mb-3 text-[17px] font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
