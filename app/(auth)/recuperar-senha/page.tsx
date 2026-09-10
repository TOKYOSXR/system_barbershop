import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos instruções para redefinir a senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-foreground">
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  );
}
