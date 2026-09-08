import BrandHeader from "../components/BrandHeader";
import HomeActions from "../components/HomeActions";

export default function HomeBuild() {
  return (
    <main className="flex min-h-screen justify-center bg-gray-200">
      <section className="min-h-screen w-[240px] bg-white">
        <BrandHeader />
        <HomeActions />
      </section>
    </main>
  );
}