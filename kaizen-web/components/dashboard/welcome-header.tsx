interface WelcomeHeaderProps {
  firstName: string;
}

export function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
      <p className="text-muted-foreground">Here&apos;s an overview of your Kaizen journey.</p>
    </div>
  );
}
