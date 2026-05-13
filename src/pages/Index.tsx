import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
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
      </div>
    </div>
  );
};

export default Index;
