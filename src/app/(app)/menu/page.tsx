import { redirect } from "next/navigation";

/** O cardápio mora na home. Links antigos para /menu continuam funcionando. */
export default function MenuPage() {
    redirect("/");
}
