import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>
          Acesse o painel da sua barbearia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
        <Link href="/recuperar-senha" className="hover:text-foreground">
          Esqueci minha senha
        </Link>
        <p>
          Ainda não tem conta?{" "}
          <Link
            href="/registrar"
            className="font-medium text-primary hover:underline"
          >
            Criar barbearia
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
