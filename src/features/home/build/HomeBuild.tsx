import BrandHeader from "../components/BrandHeader";
import HomeActions from "../components/HomeActions";

export default function HomeBuild() {
  return (
    <main className="min-h-screen bg-gray-200">
      <section className="min-h-screen w-full bg-white">
        <BrandHeader />

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeActions />
        </div>
      </section>
    </main>
  );
}