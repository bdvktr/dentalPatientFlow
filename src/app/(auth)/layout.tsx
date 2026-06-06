export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="mb-8 text-center">
        <span className="text-xl font-semibold tracking-tight">
          Dental PatientFlow AI
        </span>
      </div>
      {children}
    </div>
  );
}
