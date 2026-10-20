import AuthShell from "@/src/components/auth/AuthShell";
import HomeActions from "../components/HomeActions";

export default function HomeBuild() {
  return (
    <AuthShell>
      <HomeActions />
    </AuthShell>
  );
}
