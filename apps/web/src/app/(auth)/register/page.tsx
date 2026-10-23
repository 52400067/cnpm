import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/auth?step=register");
}
