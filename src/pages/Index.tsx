import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Startkort
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Digitalt startkort för byggprojekt
        </p>
        <Link
          to="/admin"
          className="text-sm text-foreground underline"
        >
          Gå till admin
        </Link>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Vill du veta mer om Startkort?{" "}
          <a
            href="mailto:kontakt@startkort.se"
            className="underline hover:opacity-80"
          >
            kontakt@startkort.se
          </a>
        </p>
      </div>
    </div>
  );
};

export default Index;


