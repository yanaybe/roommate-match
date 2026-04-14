import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-extrabold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-6">This page doesn't exist or was moved.</p>
        <a href="/" className="inline-block gradient-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl text-sm">
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
