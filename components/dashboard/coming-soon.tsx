import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ phase }: { phase: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Esta seção será construída na {phase}. A rota, o layout e as permissões
        já estão ativos.
      </CardContent>
    </Card>
  );
}
