import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Card className="rounded-2xl border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
            <Construction className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Trang "{title}" sẽ được phát triển trong các phiên bản tiếp theo của hệ thống.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
